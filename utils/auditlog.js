const AuditLogDB = require("../models/auditlog")

module.exports.addAduditLogs = async function
(
    component,
    functionname,
    body,
    action,
    recordId,
    userId,
    tenantId,
    //clientheaderinfo
)
{
    const audit = {}

 //   for(const [key, value] of Object.entries(body)) {
        let isEmpty = ""

      //  if(typeof value === "string") {
       //     isEmpty = value.trim()
      //  }

       // if(isEmpty !== "" && !body.randomIV) {
            audit.tenantid = tenantId, 
            audit.recordid = recordId, 
            audit.functionname = functionname, 
            audit.newvalue = JSON.stringify(body),
            audit.component = component, 
            audit.action = action, 
            audit.actionby = userId
            audit.clientheaderinfo = "test"
       // }

        try {
            const AuditRes = await AuditLogDB.createAuditLogs(audit)
            
        } catch (error) {
            console.log("Audit Error: ", error)
        }
  //  }
}
