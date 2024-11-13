function showReq(req, res, then) {
  console.warn("🔹 ShowReq");

  console.warn(req.method + ":", req.url);
  console.warn("Request : {");
  if (req.headers.authorization) {
    console.log(
      " headers.authorization (token):",
      req.headers.authorization.replace("Bearer ", "")
    );
  }
  console.log(" Params:", req.params);
  console.log(" Query:", req.query);
  console.log(" Body:", req.body);
  console.log(" Files:", req.files);
  console.warn("}");

  then();
}

module.exports = showReq;
