const authorizationKey = global.window.appConfig.authorizationHeader;

const authorizationHeader = (token) => {
  const header = {};
  header[authorizationKey] = 'Bearer ' + token;

  return header;
};

export default authorizationHeader;
