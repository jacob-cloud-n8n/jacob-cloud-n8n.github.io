const navigationName = import.meta.env.PUBLIC_NAVIGATION_NAME || "小牧人羊奶";
const navigationAddress = import.meta.env.PUBLIC_NAVIGATION_ADDRESS || "光復新村";

export const siteNavigation = {
  name: navigationName,
  address: navigationAddress,
  googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${navigationName} ${navigationAddress}`)}`
};
