**Salesforce Role Creation**

# Mode Overview

This mode assists the AI model in creating and managing Salesforce roles by generating the necessary XML files in the roles directory. It ensures that role names follow Salesforce conventions and handles parent-child role relationships. The generated XML is compliant with Salesforce Metadata API standards and ready for deployment.

**Instructions(IMPORTANT!!)**

# Strict Rules for Salesforce Role Creation

## Check Existing Role

- Before creating a new role, check if the role already exists in the roles directory.
- If the role already exists:
    - Inform the user that the role is already present.
    - Ask: "Do you want to update this role or create a different role?"
- If the role does not exist, continue with the rules below.

## Fetch Existing Roles (When Needed)

- If the user wants to create a role as a **parent** or **child** of an existing role, first fetch the existing role metadata:
  `sf project retrieve start --metadata Role:<RoleDeveloperName>`
- Replace `<RoleDeveloperName>` with the actual role developer name (e.g., CEO, Sales_Manager).

## File and Folder Creation

- **IMPORTANT:** First create a folder with the role name inside the roles directory, then create the role XML file inside that folder.
- Folder structure: `roles/<RoleDeveloperName>/`
- File inside folder: `roles/<RoleDeveloperName>/<RoleDeveloperName>.role-meta.xml`
- Example: For role `Sales_Manager`, create folder `roles/Sales_Manager/` and file `roles/Sales_Manager/Sales_Manager.role-meta.xml`

## Naming Conventions

- Replace spaces with underscores in role names.
- Role developer names must:
    - Only contain letters, numbers, and underscores.
    - Start with a letter.
    - Be unique.
    - Not end with an underscore.
    - Not contain consecutive underscores.

## Role XML Structure (MANDATORY)

- **Every role XML file must follow this exact structure:**

**For roles WITHOUT a parent:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Role xmlns="http://soap.sforce.com/2006/04/metadata">
    <caseAccessLevel>Edit</caseAccessLevel>
    <contactAccessLevel>Edit</contactAccessLevel>
    <description>Role Description</description>
    <mayForecastManagerShare>false</mayForecastManagerShare>
    <name>Role_Name</name>
    <opportunityAccessLevel>Edit</opportunityAccessLevel>
</Role>
```

**For roles WITH a parent:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Role xmlns="http://soap.sforce.com/2006/04/metadata">
    <caseAccessLevel>Edit</caseAccessLevel>
    <contactAccessLevel>Edit</contactAccessLevel>
    <description>Role Description</description>
    <mayForecastManagerShare>false</mayForecastManagerShare>
    <name>Role_Name</name>
    <opportunityAccessLevel>Edit</opportunityAccessLevel>
    <parentRole>Parent_Role_Developer_Name</parentRole>
</Role>
```

- **IMPORTANT:**
    - The `<description>` should contain a brief description of the role or can be the same as the role name.
    - The `<name>` is the label/display name of the role.
    - The `<parentRole>` tag is ONLY included when the role has a parent.
    - Always use `Edit` for `caseAccessLevel`, `contactAccessLevel`, and `opportunityAccessLevel`.
    - Always set `mayForecastManagerShare` to `false`.

## Role Hierarchy Scenarios

    ### Scenario 1: Multiple Child Roles Under Same Parent (Sibling Roles)
    - If creating multiple roles that are all **children of the same parent role** (siblings in the hierarchy):
        - All child roles will have the same `<parentRole>` tag pointing to their common parent: `<parentRole>Parent_Role_Developer_Name</parentRole>`
        - Example: Creating Employee_1, Employee_2, Employee_3 all under Manager
          - Employee_1: `<parentRole>Manager</parentRole>`
          - Employee_2: `<parentRole>Manager</parentRole>`
          - Employee_3: `<parentRole>Manager</parentRole>`
        - Create each role with its folder and XML file, then deploy each one individually.
    - **Deployment Commands (execute for each child role):**

        `sf project deploy start --source-dir force-app/main/default/roles/<ChildRole1>`
        `sf project deploy start --source-dir force-app/main/default/roles/<ChildRole2>`
        `sf project deploy start --source-dir force-app/main/default/roles/<ChildRole3>`
        ... (continue for all sibling roles)
    - **MANDATORY: After creating each child role's folder and XML file, immediately execute its deployment command. Do not skip this step for any role.**

    ### Scenario 2: Creating a Child Role (with Parent)
    - If creating a single role that is a **child of an existing role**, specify the parent role using the `<parentRole>` tag: `<parentRole>Parent_Role_Developer_Name</parentRole>`
    - **Deployment Command:**
        `sf project deploy start --source-dir force-app/main/default/roles/<ChildRoleDeveloperName>`
    - **MANDATORY: After creating the role folder and XML file, immediately execute the deployment command. Do not skip this step.**

    ### Scenario 3: Creating a Parent Role (with Child)
    - If creating a role that will be the **parent of an existing role**:
        - First, create the new parent role.
        - Then, fetch the existing child role: `sf project retrieve start --metadata Role:<ChildRoleDeveloperName>`
        - Update the child role XML to include the `<parentRole>` tag pointing to the new parent: `<parentRole>Parent_Role_Developer_Name</parentRole>`
        - Deploy both the new parent role and the updated child role.
    - **Deployment Commands:**
        Deploying parent role: `sf project deploy start --source-dir force-app/main/default/roles/<ParentRoleDeveloperName>`
        Deploying child role: `sf project deploy start --source-dir force-app/main/default/roles/<ChildRoleDeveloperName>`
    - **MANDATORY: Execute both deployment commands in order. First deploy the parent role, then deploy the child role. Do not skip this step.**

    ### Scenario 4: Creating a Middle Role (Both Parent and Child)
    - If creating a role that is **both a child of one role AND a parent of another role**:
        - First, create the new role with the `<parentRole>` tag pointing to its parent: `<parentRole>Parent_Role_Developer_Name</parentRole>`
        - Then, fetch the role that will be its child:
        `sf project retrieve start --metadata Role:<ChildRoleDeveloperName>`
        - Update the child role XML to set the new role as its parent by adding or modifying the `<parentRole>` tag: `<parentRole>New_Middle_Role_Developer_Name</parentRole>`
        - Deploy all affected roles in the correct order:
        1. Deploy the new middle role first
        2. Deploy the updated child role second
    - **Deployment Commands:**
        Deploying Middle Role: `sf project deploy start --source-dir force-app/main/default/roles/<MiddleRoleDeveloperName>`
        Deploying Child Role: `sf project deploy start --source-dir force-app/main/default/roles/<ChildRoleDeveloperName>`
    - **MANDATORY: Execute both deployment commands in order. First deploy the middle role, then deploy the child role. Do not skip this step.**

    ### Scenario 5: Standalone Role
    - If no parent/child relationship is specified, create the role without the `<parentRole>` tag.
    - **Deployment Command:**
       Deploying the developer role: `sf project deploy start --source-dir force-app/main/default/roles/<RoleDeveloperName>`
    - **MANDATORY: After creating the role folder and XML file, immediately execute the deployment command. Do not skip this step.**

## Automatic Deployment (CRITICAL - MUST FOLLOW)

- **After creating or updating ANY role XML file, you MUST immediately execute the corresponding deployment command.**
- **This is not optional. Deployment must happen automatically after every role creation or update.**
- **Never skip the deployment step. Always run the sf deploy command after file creation.**
- **For scenarios involving multiple roles, deploy them in the specified order.**
- **EXECUTE THE DEPLOYMENT COMMAND EVERY SINGLE TIME WITHOUT EXCEPTION.**

### Dry Run Before Deployment (Pre-check)

- Before executing any deployment command, first perform a dry run using the same deployment command with the `--dry-run` flag.
- If there are multiple roles to deploy, perform a single consolidated dry run for all of them at once by adding all intended targets to the same command along with `--dry-run`.

## Scenario Detection(IMPORTANT!!)

- **Before proceeding**, analyze the user's request to determine which scenario applies:
    - Are multiple roles being created under the same parent? → Scenario 1
    - Does the role have a parent? → Scenario 2 or 4
    - Does the role have a child? → Scenario 3 or 4
    - Does the role have both parent and child? → Scenario 4
    - Does the role have neither? → Scenario 5
- **DO NOT mention "Scenario 1", "Scenario 2", etc. to the user.**
- Instead, inform the user in natural language what is being created, such as:
    - "Creating multiple child roles under [Parent Role]..."
    - "Creating a child role under [Parent Role]..."
    - "Creating a parent role with [Child Role] as its child..."
    - "Creating a middle role between [Parent] and [Child]..."
    - "Creating a standalone role..."

## Role Labels

- The `<label>` should be the user-friendly name of the role.
- The `<name>` (developer name) should be the API name with underscores instead of spaces.

## Compliance

- The XML must follow Salesforce Metadata API standards.
- The XML must be deployable via:
    - Salesforce Change Sets
    - VS Code Salesforce Extensions
    - Salesforce CLI (sfdx)

## Session Behavior

- When the user requests role creation:
    - Immediately initialize the workflow.
    - Detect and inform the user (in natural language) what is being created.
    - Check for existing roles if parent/child relationships are involved.
    - Create folder first, then create the role XML file inside it with the proper XML structure.
    - **Deploy automatically in the correct order - THIS STEP IS MANDATORY AND MUST NOT BE SKIPPED.**
    - **EVERY ROLE CREATION MUST BE FOLLOWED BY ITS DEPLOYMENT COMMAND EXECUTION.**
