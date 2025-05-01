let googleMapsPromise = null;
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export const loadGoogleMaps = () => {
  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      resolve(window.google);
      return;
    }

    // Create a callback function
    const callbackName = '__googleMapsApiOnLoadCallback';
    window[callbackName] = function() {
      resolve(window.google);
      delete window[callbackName];
    };

    // Create the script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=${callbackName}&v=weekly&channel=2&nojsapi=1`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      reject(new Error('Failed to load Google Maps API'));
      delete window[callbackName];
    };

    // Add the script to the document
    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

export const initGoogleMaps = async () => {
  try {
    const google = await loadGoogleMaps();
    return google;
  } catch (error) {
    console.error('Error initializing Google Maps:', error);
    throw error;
  }
};

export const getAddressComponent = (components, type) => {
  const component = components.find(comp => comp.types.includes(type));
  return component ? component.long_name : '';
};

export const parseGoogleAddress = (place) => {
  if (!place.address_components) {
    return null;
  }

  const getComponent = (type, format = 'long_name') => {
    const component = place.address_components.find(comp => comp.types.includes(type));
    return component ? component[format] : '';
  };

  return {
    street: [
      getComponent('street_number'),
      getComponent('route')
    ].filter(Boolean).join(' '),
    city: getComponent('locality') || getComponent('sublocality_level_1'),
    state: getComponent('administrative_area_level_1'),
    zipCode: getComponent('postal_code'),
    coordinates: place.geometry?.location ? {
      latitude: place.geometry.location.lat(),
      longitude: place.geometry.location.lng()
    } : null
  };
}; 