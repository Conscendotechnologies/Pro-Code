**Salesforce Custom Profile Creation**

- When user ask to create new profile from source profile, always first run this command `sf project retrieve start --metadata "Profile:SourceProfileName"` to retrive the the source profile data.
- Then copy and paste file using this command `copy <source-profile-file-location> <new-profile-file-location>`. Use the relative file location.
- \*\*Note: don't use write_file tool, instead copy command instead. better approach is to copy the complete file with content. so you can't make mistake while writing the large profile data file.
  -Then deploy the newly created profile using this command `sf project deploy start --metadata "Profile:NewlyCreatedProfileName"`
- Then new profile creation task is completed.
