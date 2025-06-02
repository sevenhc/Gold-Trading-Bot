// errorHandling.js

function getErrorMessage(err) {
    let errMessage = err.message;
  
    switch (err.code) {
      case "UserNotConfirmedException":
        errMessage = "Please verify the email address";
        break;
      case "UserNotFoundException":
      case "NotAuthorizedException":
      case "ResourceNotFoundException":
      case "PasswordResetRequiredException":
      case "CodeDeliveryFailureException":
      case "CodeMismatchException":
      case "ExpiredCodeException":
      case "InvalidPasswordException":
      case "UserNotConfirmedException":
      case "UsernameExistsException":
        errMessage = err.message;
        break;
      default:
        errMessage = "An unexpected error occurred";
        break;
    }
  
    return errMessage;
  }
  
  module.exports = getErrorMessage;
  