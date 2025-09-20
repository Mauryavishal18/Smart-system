/*
 * Emergency Detection System - ESP32 IoT Module
 * Features:
 * - OBD-II data collection (speed, RPM, engine diagnostics)
 * - Accelerometer/Gyroscope for crash detection
 * - Heart rate and SpO2 monitoring via MAX30102
 * - GSM module for emergency SMS when offline
 * - WiFi connectivity for real-time data transmission
 * - Independent operation when phone is unavailable
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <SoftwareSerial.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <MAX30105.h>
#include <heartRate.h>
#include <spo2_algorithm.h>

// Pin definitions
#define GSM_TX_PIN 16
#define GSM_RX_PIN 17
#define OBD_TX_PIN 18
#define OBD_RX_PIN 19
#define LED_PIN 2
#define BUZZER_PIN 4
#define EMERGENCY_BUTTON_PIN 21

// Network credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverURL = "http://your-backend-url.com/api/iot/sensor-data";

// GSM module setup
SoftwareSerial gsmSerial(GSM_TX_PIN, GSM_RX_PIN);
SoftwareSerial obdSerial(OBD_TX_PIN, OBD_RX_PIN);

// Sensor instances
Adafruit_MPU6050 mpu;
MAX30105 particleSensor;

// Emergency contacts
String emergencyContacts[] = {
  "+1234567890",  // Emergency contact 1
  "+0987654321",  // Emergency contact 2
  "108"           // Ambulance service
};

// Sensor data structure
struct SensorData {
  float accelX, accelY, accelZ;
  float gyroX, gyroY, gyroZ;
  float temperature;
  int heartRate;
  int spO2;
  int vehicleSpeed;
  int engineRPM;
  bool engineFault;
  unsigned long timestamp;
};

// Global variables
SensorData currentData;
bool emergencyActive = false;
bool wifiConnected = false;
unsigned long lastDataSent = 0;
unsigned long lastHeartbeat = 0;
const unsigned long DATA_INTERVAL = 2000; // Send data every 2 seconds
const unsigned long HEARTBEAT_INTERVAL = 30000; // Heartbeat every 30 seconds

void setup() {
  Serial.begin(115200);
  gsmSerial.begin(9600);
  obdSerial.begin(38400);
  
  // Initialize pins
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(EMERGENCY_BUTTON_PIN, INPUT_PULLUP);
  
  // Initialize I2C sensors
  Wire.begin();
  
  // Initialize MPU6050
  if (!mpu.begin()) {
    Serial.println("Failed to find MPU6050 chip");
    blinkError(3);
  } else {
    Serial.println("MPU6050 initialized successfully");
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setGyroRange(MPU6050_RANGE_500_DEG);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  }
  
  // Initialize MAX30105 for heart rate and SpO2
  if (!particleSensor.begin()) {
    Serial.println("MAX30105 was not found. Please check wiring/power.");
    blinkError(4);
  } else {
    Serial.println("MAX30105 initialized successfully");
    particleSensor.setup();
    particleSensor.setPulseAmplitudeRed(0x0A);
    particleSensor.setPulseAmplitudeGreen(0);
  }
  
  // Connect to WiFi
  connectWiFi();
  
  // Initialize GSM module
  initializeGSM();
  
  // Initialize OBD-II connection
  initializeOBD();
  
  Serial.println("Emergency Detection System initialized");
  digitalWrite(LED_PIN, HIGH);
  delay(1000);
  digitalWrite(LED_PIN, LOW);
}

void loop() {
  // Read sensor data
  readSensorData();
  
  // Check for emergency conditions
  checkEmergencyConditions();
  
  // Check emergency button
  if (digitalRead(EMERGENCY_BUTTON_PIN) == LOW) {
    delay(50); // Debounce
    if (digitalRead(EMERGENCY_BUTTON_PIN) == LOW) {
      triggerEmergency("Manual SOS button pressed");
      delay(2000); // Prevent multiple triggers
    }
  }
  
  // Send data to server (if connected)
  if (millis() - lastDataSent > DATA_INTERVAL) {
    if (wifiConnected) {
      sendDataToServer();
    } else {
      // Try to reconnect WiFi
      connectWiFi();
    }
    lastDataSent = millis();
  }
  
  // Send heartbeat
  if (millis() - lastHeartbeat > HEARTBEAT_INTERVAL) {
    sendHeartbeat();
    lastHeartbeat = millis();
  }
  
  // Handle emergency state
  if (emergencyActive) {
    handleEmergencyState();
  }
  
  delay(100);
}

void readSensorData() {
  // Read MPU6050 data
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);
  
  currentData.accelX = a.acceleration.x;
  currentData.accelY = a.acceleration.y;
  currentData.accelZ = a.acceleration.z;
  currentData.gyroX = g.gyro.x;
  currentData.gyroY = g.gyro.y;
  currentData.gyroZ = g.gyro.z;
  currentData.temperature = temp.temperature;
  
  // Read heart rate and SpO2
  readVitalSigns();
  
  // Read OBD-II data
  readOBDData();
  
  currentData.timestamp = millis();
}

void readVitalSigns() {
  static const byte RATE_ARRAY_SIZE = 4;
  static byte rateArray[RATE_ARRAY_SIZE];
  static byte rateArrayIndex = 0;
  static long lastBeat = 0;
  static long delta = 0;
  static int beatsPerMinute = 0;
  
  long irValue = particleSensor.getIR();
  
  if (checkForBeat(irValue)) {
    delta = millis() - lastBeat;
    lastBeat = millis();
    
    beatsPerMinute = 60 / (delta / 1000.0);
    
    if (beatsPerMinute < 255 && beatsPerMinute > 20) {
      rateArray[rateArrayIndex++] = (byte)beatsPerMinute;
      rateArrayIndex %= RATE_ARRAY_SIZE;
      
      long total = 0;
      for (byte i = 0; i < RATE_ARRAY_SIZE; i++) {
        total += rateArray[i];
      }
      currentData.heartRate = total / RATE_ARRAY_SIZE;
    }
  }
  
  // SpO2 calculation (simplified)
  uint32_t redBuffer[100], irBuffer[100];
  for (int i = 0; i < 100; i++) {
    while (!particleSensor.available()) particleSensor.check();
    redBuffer[i] = particleSensor.getRed();
    irBuffer[i] = particleSensor.getIR();
    particleSensor.nextSample();
  }
  
  int32_t spo2;
  int8_t validSPO2;
  int32_t heartRate2;
  int8_t validHeartRate;
  
  maxim_heart_rate_and_oxygen_saturation(irBuffer, 100, redBuffer, &spo2, &validSPO2, &heartRate2, &validHeartRate);
  
  if (validSPO2) {
    currentData.spO2 = spo2;
  }
}

void readOBDData() {
  // Request vehicle speed (PID 0x0D)
  obdSerial.println("010D");
  delay(100);
  
  if (obdSerial.available()) {
    String response = obdSerial.readString();
    if (response.indexOf("41 0D") >= 0) {
      int speedHex = response.substring(6, 8).toInt();
      currentData.vehicleSpeed = speedHex; // km/h
    }
  }
  
  // Request engine RPM (PID 0x0C)
  obdSerial.println("010C");
  delay(100);
  
  if (obdSerial.available()) {
    String response = obdSerial.readString();
    if (response.indexOf("41 0C") >= 0) {
      String rpmHex = response.substring(6, 10);
      int rpmValue = strtol(rpmHex.c_str(), NULL, 16);
      currentData.engineRPM = rpmValue / 4;
    }
  }
  
  // Check for diagnostic trouble codes
  obdSerial.println("0101");
  delay(100);
  
  if (obdSerial.available()) {
    String response = obdSerial.readString();
    currentData.engineFault = response.indexOf("41 01") >= 0;
  }
}

void checkEmergencyConditions() {
  bool accidentDetected = false;
  String emergencyReason = "";
  
  // High impact detection
  float accelMagnitude = sqrt(pow(currentData.accelX, 2) + pow(currentData.accelY, 2) + pow(currentData.accelZ, 2));
  if (accelMagnitude > 20.0) { // High G-force threshold
    accidentDetected = true;
    emergencyReason = "High impact detected: " + String(accelMagnitude) + "G";
  }
  
  // Sudden deceleration
  static float lastSpeed = 0;
  float speedChange = abs(currentData.vehicleSpeed - lastSpeed);
  if (speedChange > 30 && currentData.vehicleSpeed < 10) { // Sudden stop
    accidentDetected = true;
    emergencyReason = "Sudden deceleration detected";
  }
  lastSpeed = currentData.vehicleSpeed;
  
  // Medical emergency detection
  if (currentData.heartRate > 120 || currentData.heartRate < 50) {
    if (currentData.spO2 < 90) {
      accidentDetected = true;
      emergencyReason = "Medical emergency: HR=" + String(currentData.heartRate) + " SpO2=" + String(currentData.spO2);
    }
  }
  
  // Vehicle rollover detection
  if (abs(currentData.gyroX) > 3.0 || abs(currentData.gyroY) > 3.0) {
    accidentDetected = true;
    emergencyReason = "Vehicle rollover detected";
  }
  
  if (accidentDetected && !emergencyActive) {
    triggerEmergency(emergencyReason);
  }
}

void triggerEmergency(String reason) {
  emergencyActive = true;
  Serial.println("EMERGENCY TRIGGERED: " + reason);
  
  // Activate visual and audio alerts
  digitalWrite(LED_PIN, HIGH);
  for (int i = 0; i < 5; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(200);
    digitalWrite(BUZZER_PIN, LOW);
    delay(200);
  }
  
  // Send emergency SMS via GSM
  sendEmergencySMS(reason);
  
  // Send emergency alert to server
  if (wifiConnected) {
    sendEmergencyAlert(reason);
  }
  
  Serial.println("Emergency protocols activated");
}

void sendEmergencySMS(String reason) {
  String message = "EMERGENCY ALERT! " + reason + 
                  " Location: GPS coordinates needed. " +
                  "Speed: " + String(currentData.vehicleSpeed) + "km/h " +
                  "Time: " + String(millis()/1000) + "s";
  
  for (int i = 0; i < sizeof(emergencyContacts)/sizeof(emergencyContacts[0]); i++) {
    gsmSerial.println("AT+CMGF=1"); // Set SMS mode
    delay(1000);
    gsmSerial.println("AT+CMGS=\"" + emergencyContacts[i] + "\"");
    delay(1000);
    gsmSerial.print(message);
    gsmSerial.write(26); // Ctrl+Z to send
    delay(5000);
    
    Serial.println("Emergency SMS sent to: " + emergencyContacts[i]);
  }
}

void sendEmergencyAlert(String reason) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(String(serverURL) + "/emergency");
    http.addHeader("Content-Type", "application/json");
    
    StaticJsonDocument<1024> doc;
    doc["type"] = "accident_detected";
    doc["reason"] = reason;
    doc["deviceId"] = WiFi.macAddress();
    doc["timestamp"] = millis();
    
    JsonObject sensorData = doc.createNestedObject("sensorData");
    sensorData["accelerometer"]["x"] = currentData.accelX;
    sensorData["accelerometer"]["y"] = currentData.accelY;
    sensorData["accelerometer"]["z"] = currentData.accelZ;
    sensorData["gyroscope"]["x"] = currentData.gyroX;
    sensorData["gyroscope"]["y"] = currentData.gyroY;
    sensorData["gyroscope"]["z"] = currentData.gyroZ;
    sensorData["heartRate"] = currentData.heartRate;
    sensorData["spO2"] = currentData.spO2;
    sensorData["speed"] = currentData.vehicleSpeed;
    sensorData["engineRPM"] = currentData.engineRPM;
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    int httpResponseCode = http.POST(jsonString);
    
    if (httpResponseCode > 0) {
      Serial.println("Emergency alert sent to server: " + String(httpResponseCode));
    } else {
      Serial.println("Failed to send emergency alert: " + String(httpResponseCode));
    }
    
    http.end();
  }
}

void sendDataToServer() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverURL);
    http.addHeader("Content-Type", "application/json");
    
    StaticJsonDocument<512> doc;
    doc["deviceId"] = WiFi.macAddress();
    doc["timestamp"] = millis();
    doc["accelX"] = currentData.accelX;
    doc["accelY"] = currentData.accelY;
    doc["accelZ"] = currentData.accelZ;
    doc["gyroX"] = currentData.gyroX;
    doc["gyroY"] = currentData.gyroY;
    doc["gyroZ"] = currentData.gyroZ;
    doc["heartRate"] = currentData.heartRate;
    doc["spO2"] = currentData.spO2;
    doc["vehicleSpeed"] = currentData.vehicleSpeed;
    doc["engineRPM"] = currentData.engineRPM;
    doc["temperature"] = currentData.temperature;
    doc["emergencyActive"] = emergencyActive;
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    int httpResponseCode = http.POST(jsonString);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Data sent successfully: " + String(httpResponseCode));
    }
    
    http.end();
  }
}

void sendHeartbeat() {
  if (wifiConnected) {
    HTTPClient http;
    http.begin(String(serverURL) + "/heartbeat");
    http.addHeader("Content-Type", "application/json");
    
    StaticJsonDocument<200> doc;
    doc["deviceId"] = WiFi.macAddress();
    doc["timestamp"] = millis();
    doc["status"] = "online";
    doc["emergencyActive"] = emergencyActive;
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    http.POST(jsonString);
    http.end();
  }
}

void handleEmergencyState() {
  static unsigned long lastBlink = 0;
  static bool ledState = false;
  
  // Blink LED rapidly during emergency
  if (millis() - lastBlink > 500) {
    ledState = !ledState;
    digitalWrite(LED_PIN, ledState);
    lastBlink = millis();
  }
  
  // Check for emergency cancellation (long press button)
  static unsigned long buttonPressStart = 0;
  if (digitalRead(EMERGENCY_BUTTON_PIN) == LOW) {
    if (buttonPressStart == 0) {
      buttonPressStart = millis();
    } else if (millis() - buttonPressStart > 5000) { // 5 second press
      emergencyActive = false;
      digitalWrite(LED_PIN, LOW);
      digitalWrite(BUZZER_PIN, LOW);
      Serial.println("Emergency cancelled by user");
      buttonPressStart = 0;
    }
  } else {
    buttonPressStart = 0;
  }
}

void connectWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(1000);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("");
    Serial.println("WiFi connected!");
    Serial.println("IP address: " + WiFi.localIP().toString());
  } else {
    wifiConnected = false;
    Serial.println("");
    Serial.println("WiFi connection failed. Operating in offline mode.");
  }
}

void initializeGSM() {
  Serial.println("Initializing GSM module...");
  gsmSerial.println("AT");
  delay(1000);
  
  gsmSerial.println("AT+CPIN?");
  delay(1000);
  
  gsmSerial.println("AT+CREG?");
  delay(1000);
  
  gsmSerial.println("AT+CGATT?");
  delay(1000);
  
  Serial.println("GSM module initialized");
}

void initializeOBD() {
  Serial.println("Initializing OBD-II connection...");
  obdSerial.println("ATZ"); // Reset
  delay(1000);
  
  obdSerial.println("ATE0"); // Echo off
  delay(1000);
  
  obdSerial.println("ATL0"); // Linefeeds off
  delay(1000);
  
  obdSerial.println("ATS0"); // Spaces off
  delay(1000);
  
  obdSerial.println("ATSP0"); // Auto protocol
  delay(1000);
  
  Serial.println("OBD-II initialized");
}

void blinkError(int count) {
  for (int i = 0; i < count; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(200);
    digitalWrite(LED_PIN, LOW);
    delay(200);
  }
}