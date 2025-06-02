// const db = require("../config/database");


exports.UserAdminCreate = (pw) => {
  return DBConnection.query("CALL usercreate(?, ?, ?, ?, ?, ?, ?)",
      ["Offerwall", "Admin", pw, "admin@offerwall.com",
      1, "", 1]);
}

exports.UserCreate = (user) => {
  return DBConnection.query("CALL usercreate(?, ?, ?, ?, ?, ?, ?)",
      [user.userfirstname, user.userlastname, user.userpassword, user.useremailaddress,
      user.userisactive, user.usersalt, user.adminid]);
}

exports.UserUpdate = (user) => {
  return DBConnection.query("CALL userupdate(?, ?, ?, ?, ?)",
      [user.userid, user.userfirstname, user.userlastname,
      user.userisactive, user.adminid]);
}

exports.UserDelete = (user) => {
  return DBConnection.query("CALL userdelete(?, ?)",
      [user.userid, user.adminid]);
}

exports.UserGetAll = () => {
  return DBConnection.query("CALL usergetall()");
}

exports.UserGetByID = (userid) => {
  return DBConnection.query("CALL usergetbyid(?)",
      [userid]);
}

exports.UserLogin = (user) => {
  return DBConnection.query("CALL userlogin(?)",
      [user.useremailaddress]);
}

exports.UserChangePassword = (user) => {
  return DBConnection.query("CALL userchangepassword(?, ?, ?)",
      [user.useremailaddress, user.userpassword, user.usersalt]);
}


exports.UserChangePassword = (user) => {
  return DBConnection.query("CALL userchangepassword(?, ?, ?)",
      [user.useremailaddress, user.userpassword, user.usersalt]);
}

exports.tokenVerification = (token) => {
  return DBConnection.query(
    "CALL `offerwall`.`tokenVerification`(?);",
    [token]
  );
};


exports.AddTokens = (accessToken, refreshToken) => {
  return DBConnection.query("CALL tokenadd(?, ?)", [
    accessToken,
    refreshToken,
  ]);
};

exports.DeleteTokens = (accessToken, refreshToken) => {
  return DBConnection.query("CALL tokendelete(?, ?)", [
    accessToken,
    refreshToken,
  ]);
};

exports.GetTokens = (token, type) => {
  return DBConnection.query("CALL tokenget(?, ?)", [
    token,
    type,
  ]);
};