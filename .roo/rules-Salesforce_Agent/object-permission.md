**Salesforce Custom Profile Creation**

- When user ask to assign objects permission a profile, always first run this command `sf project retrieve start --metadata "Profile:ProfileName"` to retrive the the profile data.
  \*\*Note: you have to retrieve profile every time to ensure that we have latest data.
- Then first make list make list of objects with permission which user want to assign permission to which profile
  \*\*Note: This is structure of adding object permissions
  <objectPermissions>
  <allowCreate>true</allowCreate>
  <allowDelete>true</allowDelete>
  <allowEdit>true</allowEdit>
  <allowRead>true</allowRead>
  <modifyAllRecords>true</modifyAllRecords>
  <object>ObjectName</object>
  <viewAllRecords>true</viewAllRecords>
  </objectPermissions>
- \*\*Note: While assiging the permissions make sure you these rules
  <rules>

1. read permisssion is required to give create permission.
1. read permisssion is required to give edit permission.
1. read and edit permissions are required to give delete permission.
1. read permission is required to give view all records permission.
1. read, edit, delete and view all records permission are required to give modify all records permission.
   </rules>

- Then object permisison asignment task is completed.
