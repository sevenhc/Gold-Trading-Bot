DROP PROCEDURE IF EXISTS offerwall.clientcreate;

DELIMITER $$
$$
CREATE DEFINER=`offerwalluser`@`%` PROCEDURE `offerwall`.`clientcreate`(
IN pclientusername VARCHAR(255), 
IN pclientuserkey VARCHAR(255),
IN pexternaluserid varchar(255),
IN pencryptedemail VARCHAR(255),
IN ptenantId INT,
IN pdefaultlanguageid INT,
IN pclienttoken VARCHAR(255),
IN pclientIV VARCHAR(200), 
IN pauthtag VARBINARY(100),
IN ptokenauthtag VARBINARY(100),
IN pdisplayemail VARCHAR(100)
)
BEGIN
	DECLARE clientcount INT;
    
	DECLARE verificationTokenIssued DATETIME;
	DECLARE issignupdone VARCHAR(45);
            
    SELECT COUNT(clientid) INTO clientcount
    FROM clientmaster
    WHERE username = pclientusername AND tenantid = ptenantId;

    IF clientcount = 0 THEN    
		INSERT INTO `offerwall`.`clientmaster`
			(`username`, `userkey`, `externaluserid`, `email`, `defaultlanguageid`, `tenantid`,
			`verificationtoken`, `verificationsentat`, `clientIV`, `istermsaccepted`, `terms`,
			`authtag`, `tokenauthtag`, `displayemail`)
		VALUES (pclientusername, pclientuserkey, pexternaluserid, pencryptedemail,
			pdefaultlanguageid, ptenantId, pclienttoken, current_timestamp(), pclientIV, 1,
			(SELECT tenanttermsandconditions FROM tenantcontent 
				WHERE tenantmasterid=ptenantid and languagemasterid=pdefaultlanguageid),
			pauthtag, ptokenauthtag, pdisplayemail);
            
        SELECT clientid FROM clientmaster WHERE clientid = LAST_INSERT_ID();
	ELSE
		BEGIN
			
			SELECT issignupcomplete INTO issignupdone
			FROM clientmaster
			WHERE username = pclientusername AND tenantid = ptenantId
			AND issignupcomplete = 1 LIMIT 1;
		
		SELECT timestampdiff(MINUTE, `clientmaster`.`verificationsentat`, CURRENT_TIMESTAMP()) 
				INTO @verificationTokenIssued
			FROM `offerwall`.`clientmaster` 
			WHERE username = pclientusername AND tenantid = ptenantId
			ORDER BY verificationsentat DESC LIMIT 1;
			
			IF((ISNULL(@verificationTokenIssued) 
			OR (@verificationTokenIssued>5)) AND ISNULL(issignupdone)) THEN
				DELETE FROM `offerwall`.`clientmaster`
				WHERE username = pclientusername AND tenantid = ptenantId;
                    
				INSERT INTO `offerwall`.`clientmaster`
					(`username`, `userkey`, `externaluserid`, `email`, `defaultlanguageid`, `tenantid`,
					`verificationtoken`, `verificationsentat`, `clientIV`, `istermsaccepted`, `terms`,
					`authtag`, `tokenauthtag`, `displayemail`)
				VALUES (pclientusername, pclientuserkey, pexternaluserid, pencryptedemail,
					pdefaultlanguageid, ptenantId, pclienttoken, current_timestamp(), pclientIV, 1,
					(SELECT tenanttermsandconditions FROM tenantcontent 
					WHERE tenantmasterid=ptenantid and languagemasterid=pdefaultlanguageid),
					pauthtag, ptokenauthtag, pdisplayemail);
                    
                SELECT clientid FROM clientmaster WHERE clientid = LAST_INSERT_ID();
			ELSE
				SELECT 'Email already exist.' message;
			END IF;
		END;
	END IF;
END$$
DELIMITER ;
