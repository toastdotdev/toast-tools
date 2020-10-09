exports.makeStarterURL = (starter) => {
  if (!starter) {
    return "toastdotdev/starters/default#main";
  }
  if (!starter.includes("/")) {
    return `toastdotdev/starters/${starter}#main`;
  }
  if (!starter.includes("#")) {
    return `${starter}#main`;
  }
  return starter;
};
