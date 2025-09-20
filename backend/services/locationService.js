import User from '../models/User.js';

export const getNearbyResponders = async (location, radiusKm) => {
  try {
    const { latitude, longitude } = location;
    
    // Convert radius from km to degrees (rough approximation)
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));

    // Find nearby volunteers, hospitals, and police
    const responders = await User.find({
      role: { $in: ['volunteer', 'hospital', 'police'] },
      isActive: true,
      'location.latitude': {
        $gte: latitude - latDelta,
        $lte: latitude + latDelta
      },
      'location.longitude': {
        $gte: longitude - lngDelta,
        $lte: longitude + lngDelta
      }
    }).select('name phone role location deviceTokens');

    // Calculate actual distances and sort
    const respondersWithDistance = responders.map(responder => {
      const distance = calculateDistance(
        latitude, longitude,
        responder.location.latitude, responder.location.longitude
      );
      
      return {
        ...responder.toObject(),
        distance,
        eta: Math.round(distance * 2) // Rough ETA in minutes
      };
    }).sort((a, b) => a.distance - b.distance);

    return respondersWithDistance;
  } catch (error) {
    console.error('Error finding nearby responders:', error);
    return [];
  }
};

const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const updateUserLocation = async (userId, location) => {
  try {
    await User.findByIdAndUpdate(userId, {
      location: {
        ...location,
        lastUpdated: new Date()
      }
    });
    return true;
  } catch (error) {
    console.error('Error updating user location:', error);
    return false;
  }
};