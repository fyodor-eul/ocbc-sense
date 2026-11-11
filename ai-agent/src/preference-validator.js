
const allowedActions = {
  increase_text_size: ["large"],
  decrease_text_size: ["default"],
  simplify_language: [true],
  change_language: ["en", "zh", "ms"],
  read_aloud: [true]
};

function validatePreference(action, value) {
  if (!Object.prototype.hasOwnProperty.call(
    allowedActions,
    action
  )) {
    return false;
  }

  return allowedActions[action].includes(value);
}

module.exports = { validatePreference };
