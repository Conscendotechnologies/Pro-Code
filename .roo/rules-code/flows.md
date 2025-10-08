# Salesforce Flow XML Creation Guide

## Overview

This guide provides comprehensive instructions for creating Salesforce Flow XML files for any scenario. All schema definitions and element structures should be referenced from [flow-schema.md](flow-schema.md).

## Table of Contents

1. [File Naming Convention Rules](#file-nameing-convention-rules)
2. [Deployment Steps](#deployment-steps)
3. [Basic Flow Structure](#basic-flow-structure)
4. [Flow Types and Use Cases](#flow-types-and-use-cases)
5. [Core Components](#core-components)
6. [Building Flow Elements](#building-flow-elements)
7. [Best Practices](#best-practices)
8. [Common Patterns](#common-patterns)

---

## File Naming Convention Rules

- file name format: Flow_Name.flow.meta.xml
- Flow name should upper case lower case and spcial char(\_) only.

---

## Deployment Steps

- after completing the task, run this command to deploy the flow using `sf project deploy start --metadata "Flow:Set_Default_Contact_Email" --ignore-conflicts` command. it will deploy flow to default org.

---

## Basic Flow Structure

Every Salesforce Flow XML file follows this fundamental structure:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Flow xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>62.0</apiVersion>
    <label>Flow Label</label>
    <processType>Flow</processType>
    <status>Active</status>

    <!-- Variables, Constants, Formulas -->

    <!-- Start Element -->
    <start>
        <!-- Start configuration -->
    </start>


    <!-- Flow Elements (Screens, Actions, Decisions, etc.) -->

</Flow>
```

### Required Root Elements

- `apiVersion`: Current API version (e.g., 62.0)
- `label`: Human-readable flow name
- `processType`: Either "Flow" or "Process"
- `status`: "Active", "Draft", or "Obsolete"

---

## Flow Types and Use Cases

### 1. Screen Flow

**Purpose**: User interaction with visual screens
**Trigger Type**: Manual (invoked by user)

```xml
<processType>Flow</processType>
<start>
    <locationX>50</locationX>
    <locationY>0</locationY>
</start>
```

### 2. Record-Triggered Flow (Before Save)

**Purpose**: Runs before record is saved to database
**Trigger Type**: RecordBeforeSave

```xml
<start>
    <locationX>50</locationX>
    <locationY>0</locationY>
    <connector>
        <targetReference>FirstElement</targetReference>
    </connector>
    <object>Account</object>
    <recordTriggerType>Create</recordTriggerType>
    <triggerType>RecordBeforeSave</triggerType>
</start>
```

### 3. Record-Triggered Flow (After Save)

**Purpose**: Runs after record is committed to database
**Trigger Type**: RecordAfterSave

```xml
<start>
    <locationX>50</locationX>
    <locationY>0</locationY>
    <connector>
        <targetReference>FirstElement</targetReference>
    </connector>
    <object>Opportunity</object>
    <recordTriggerType>CreateAndUpdate</recordTriggerType>
    <triggerType>RecordAfterSave</triggerType>
</start>
```

### 4. Scheduled Flow

**Purpose**: Runs on a specific schedule
**Trigger Type**: Scheduled

```xml
<start>
    <locationX>50</locationX>
    <locationY>0</locationY>
    <connector>
        <targetReference>GetRecords</targetReference>
    </connector>
    <schedule>
        <frequency>Daily</frequency>
        <startDate>2025-01-01</startDate>
        <startTime>09:00:00.000Z</startTime>
    </schedule>
    <triggerType>Scheduled</triggerType>
</start>
```

### 5. Autolaunched Flow

**Purpose**: Invoked by another process or API
**Trigger Type**: None (no automatic trigger)

```xml
<processType>Flow</processType>
<start>
    <locationX>50</locationX>
    <locationY>0</locationY>
    <connector>
        <targetReference>FirstElement</targetReference>
    </connector>
</start>
```

---

## Core Components

### Variables

Variables store values during flow execution. Reference schema: `FlowVariable`

```xml
<variables>
    <name>varAccountName</name>
    <dataType>String</dataType>
    <isCollection>false</isCollection>
    <isInput>false</isInput>
    <isOutput>false</isOutput>
</variables>
```

**Variable Properties**:

- `name`: Unique identifier (no spaces)
- `dataType`: String, Number, Boolean, Date, DateTime, Currency, SObject, Apex
- `isCollection`: true for lists/collections
- `isInput`: true to receive values from external source
- `isOutput`: true to return values
- `value`: Optional default value

### Constants

Immutable values. Reference schema: `FlowConstant`

```xml
<constants>
    <name>DefaultDiscount</name>
    <dataType>Number</dataType>
    <value>
        <numberValue>10.0</numberValue>
    </value>
</constants>
```

### Formulas

Dynamic calculations. Reference schema: `FlowFormula`

```xml
<formulas>
    <name>TotalPrice</name>
    <dataType>Currency</dataType>
    <expression>{!Quantity} * {!UnitPrice}</expression>
</formulas>
```

---

## Building Flow Elements

### 1. Record Lookup (Get Records)

Reference schema: `FlowRecordLookup`

```xml
<recordLookups>
    <name>Get_Account</name>
    <label>Get Account</label>
    <locationX>176</locationX>
    <locationY>134</locationY>
    <assignNullValuesIfNoRecordsFound>false</assignNullValuesIfNoRecordsFound>
    <connector>
        <targetReference>NextElement</targetReference>
    </connector>
    <filterLogic>and</filterLogic>
    <filters>
        <field>Id</field>
        <operator>EqualTo</operator>
        <value>
            <elementReference>recordId</elementReference>
        </value>
    </filters>
    <getFirstRecordOnly>true</getFirstRecordOnly>
    <object>Account</object>
    <storeOutputAutomatically>true</storeOutputAutomatically>
</recordLookups>
```

**Key Properties**:

- `getFirstRecordOnly`: true for single record, false for collection
- `storeOutputAutomatically`: true to auto-assign to variable
- `filters`: Filter conditions (see FlowRecordFilter schema)
- `filterLogic`: "and", "or", or custom logic (e.g., "1 AND (2 OR 3)")

### 2. Record Create

Reference schema: `FlowRecordCreate`

```xml
<recordCreates>
    <name>Create_Contact</name>
    <label>Create Contact</label>
    <locationX>176</locationX>
    <locationY>242</locationY>
    <connector>
        <targetReference>NextElement</targetReference>
    </connector>
    <inputAssignments>
        <field>FirstName</field>
        <value>
            <stringValue>John</stringValue>
        </value>
    </inputAssignments>
    <inputAssignments>
        <field>LastName</field>
        <value>
            <elementReference>varLastName</elementReference>
        </value>
    </inputAssignments>
    <inputAssignments>
        <field>AccountId</field>
        <value>
            <elementReference>Get_Account.Id</elementReference>
        </value>
    </inputAssignments>
    <object>Contact</object>
    <storeOutputAutomatically>true</storeOutputAutomatically>
</recordCreates>
```

### 3. Record Update

Reference schema: `FlowRecordUpdate`

```xml
<recordUpdates>
    <name>Update_Account_Status</name>
    <label>Update Account Status</label>
    <locationX>176</locationX>
    <locationY>350</locationY>
    <connector>
        <targetReference>NextElement</targetReference>
    </connector>
    <filters>
        <field>Id</field>
        <operator>EqualTo</operator>
        <value>
            <elementReference>recordId</elementReference>
        </value>
    </filters>
    <inputAssignments>
        <field>Status__c</field>
        <value>
            <stringValue>Active</stringValue>
        </value>
    </inputAssignments>
    <object>Account</object>
</recordUpdates>
```

### 4. Record Delete

Reference schema: `FlowRecordDelete`

```xml
<recordDeletes>
    <name>Delete_Records</name>
    <label>Delete Records</label>
    <locationX>176</locationX>
    <locationY>458</locationY>
    <connector>
        <targetReference>NextElement</targetReference>
    </connector>
    <filters>
        <field>Status__c</field>
        <operator>EqualTo</operator>
        <value>
            <stringValue>Inactive</stringValue>
        </value>
    </filters>
    <object>Contact</object>
</recordDeletes>
```

### 5. Assignment

Reference schema: `FlowAssignment`

```xml
<assignments>
    <name>Assign_Values</name>
    <label>Assign Values</label>
    <locationX>176</locationX>
    <locationY>566</locationY>
    <assignmentItems>
        <assignToReference>varCounter</assignToReference>
        <operator>Add</operator>
        <value>
            <numberValue>1.0</numberValue>
        </value>
    </assignmentItems>
    <assignmentItems>
        <assignToReference>varStatus</assignToReference>
        <operator>Assign</operator>
        <value>
            <stringValue>Completed</stringValue>
        </value>
    </assignmentItems>
    <connector>
        <targetReference>NextElement</targetReference>
    </connector>
</assignments>
```

**Assignment Operators**:

- `Assign`: Set value
- `Add`: Add number or append to collection
- `Subtract`: Subtract number
- `AddItem`: Add item to collection

### 6. Decision

Reference schema: `FlowDecision`

**IMPORTANT RULE**: Always include `defaultConnectorLabel` in decision elements, even when `defaultConnector` is not used. This is a required field for proper Flow functionality.

```xml
<decisions>
    <name>Check_Amount</name>
    <label>Check Amount</label>
    <locationX>176</locationX>
    <locationY>674</locationY>
    <defaultConnector>
        <targetReference>Default_Path</targetReference>
    </defaultConnector>
    <defaultConnectorLabel>Default Outcome</defaultConnectorLabel>
    <rules>
        <name>High_Amount</name>
        <conditionLogic>and</conditionLogic>
        <conditions>
            <leftValueReference>Amount</leftValueReference>
            <operator>GreaterThan</operator>
            <rightValue>
                <numberValue>10000.0</numberValue>
            </rightValue>
        </conditions>
        <connector>
            <targetReference>High_Amount_Actions</targetReference>
        </connector>
        <label>High Amount</label>
    </rules>
    <rules>
        <name>Medium_Amount</name>
        <conditionLogic>and</conditionLogic>
        <conditions>
            <leftValueReference>Amount</leftValueReference>
            <operator>GreaterThanOrEqualTo</operator>
            <rightValue>
                <numberValue>1000.0</numberValue>
            </rightValue>
        </conditions>
        <conditions>
            <leftValueReference>Amount</leftValueReference>
            <operator>LessThanOrEqualTo</operator>
            <rightValue>
                <numberValue>10000.0</numberValue>
            </rightValue>
        </conditions>
        <connector>
            <targetReference>Medium_Amount_Actions</targetReference>
        </connector>
        <label>Medium Amount</label>
    </rules>
</decisions>
```

**Example without defaultConnector** (still requires defaultConnectorLabel):

```xml
<decisions>
    <name>Check_Status</name>
    <label>Check Status</label>
    <locationX>176</locationX>
    <locationY>350</locationY>
    <defaultConnectorLabel>No Match</defaultConnectorLabel>
    <rules>
        <name>Active_Status</name>
        <conditionLogic>and</conditionLogic>
        <conditions>
            <leftValueReference>Status</leftValueReference>
            <operator>EqualTo</operator>
            <rightValue>
                <stringValue>Active</stringValue>
            </rightValue>
        </conditions>
        <connector>
            <targetReference>Process_Active</targetReference>
        </connector>
        <label>Active Status</label>
    </rules>
</decisions>
```

### 7. Loop

Reference schema: `FlowLoop`

```xml
<loops>
    <name>Loop_Through_Contacts</name>
    <label>Loop Through Contacts</label>
    <locationX>176</locationX>
    <locationY>782</locationY>
    <collectionReference>ContactCollection</collectionReference>
    <iterationOrder>Asc</iterationOrder>
    <nextValueConnector>
        <targetReference>Process_Contact</targetReference>
    </nextValueConnector>
    <noMoreValuesConnector>
        <targetReference>After_Loop</targetReference>
    </noMoreValuesConnector>
</loops>
```

### 8. Screen

Reference schema: `FlowScreen`

```xml
<screens>
    <name>Input_Screen</name>
    <label>Input Screen</label>
    <locationX>176</locationX>
    <locationY>890</locationY>
    <allowBack>true</allowBack>
    <allowFinish>true</allowFinish>
    <allowPause>false</allowPause>
    <connector>
        <targetReference>Process_Input</targetReference>
    </connector>
    <fields>
        <name>AccountNameField</name>
        <dataType>String</dataType>
        <fieldText>Account Name</fieldText>
        <fieldType>InputField</fieldType>
        <isRequired>true</isRequired>
    </fields>
    <fields>
        <name>DisplayText</name>
        <fieldText>&lt;p&gt;Enter account information&lt;/p&gt;</fieldText>
        <fieldType>DisplayText</fieldType>
    </fields>
    <showFooter>true</showFooter>
    <showHeader>true</showHeader>
</screens>
```

### 9. Subflow

Reference schema: `FlowSubflow`

```xml
<subflows>
    <name>Call_Validation_Flow</name>
    <label>Call Validation Flow</label>
    <locationX>176</locationX>
    <locationY>998</locationY>
    <connector>
        <targetReference>Next_Step</targetReference>
    </connector>
    <flowName>Validation_Flow</flowName>
    <inputAssignments>
        <name>inputAccountId</name>
        <value>
            <elementReference>recordId</elementReference>
        </value>
    </inputAssignments>
    <outputAssignments>
        <assignToReference>varIsValid</assignToReference>
        <name>outputIsValid</name>
    </outputAssignments>
</subflows>
```

### 10. Action Call

Reference schema: `FlowActionCall`

```xml
<actionCalls>
    <name>Send_Email</name>
    <label>Send Email</label>
    <locationX>176</locationX>
    <locationY>1106</locationY>
    <actionName>emailSimple</actionName>
    <actionType>emailSimple</actionType>
    <connector>
        <targetReference>Next_Element</targetReference>
    </connector>
    <inputParameters>
        <name>emailAddresses</name>
        <value>
            <elementReference>varEmailAddress</elementReference>
        </value>
    </inputParameters>
    <inputParameters>
        <name>emailSubject</name>
        <value>
            <stringValue>Your Account is Active</stringValue>
        </value>
    </inputParameters>
    <inputParameters>
        <name>emailBody</name>
        <value>
            <elementReference>EmailBodyTemplate</elementReference>
        </value>
    </inputParameters>
</actionCalls>
```

---

## Best Practices

### 1. Naming Conventions

- **Element Names**: Use PascalCase without spaces (e.g., `Get_Account_Record`)
- **Variables**: Prefix with `var` (e.g., `varAccountName`)
- **Constants**: Use descriptive names (e.g., `DefaultTaxRate`)
- **Labels**: Use human-readable text with spaces

### 2. Coordinates (locationX, locationY)

- Start at X=50-176, Y=0
- Increment Y by 108-134 for each vertical element
- Maintain consistent X for linear flows
- Branch decisions horizontally by incrementing X

### 3. Error Handling

Always include fault connectors for DML operations:

```xml
<recordCreates>
    <name>Create_Record</name>
    <!-- ... other properties ... -->
    <connector>
        <targetReference>Success_Path</targetReference>
    </connector>
    <faultConnector>
        <targetReference>Error_Handler</targetReference>
    </faultConnector>
</recordCreates>
```

### 4. Bulkification

- Process collections when possible
- Use `Get Records` with collections instead of single records in loops
- Perform DML operations outside loops

### 5. Filter Logic

Use `filterLogic` for complex conditions:

```xml
<filterLogic>1 AND (2 OR 3)</filterLogic>
```

Numbers correspond to filter order.

### 6. Last element doesn't need to be connected to end element.

---

## Common Patterns

### Pattern 1: Get-Update Pattern

```xml
<!-- Step 1: Get Record -->
<recordLookups>
    <name>Get_Record</name>
    <object>Account</object>
    <storeOutputAutomatically>true</storeOutputAutomatically>
    <!-- filters -->
</recordLookups>

<!-- Step 2: Update Record -->
<recordUpdates>
    <name>Update_Record</name>
    <inputReference>Get_Record</inputReference>
    <inputAssignments>
        <!-- field updates -->
    </inputAssignments>
</recordUpdates>
```

### Pattern 2: Decision-Based Processing

```xml
<decisions>
    <name>Check_Criteria</name>
    <defaultConnector>
        <targetReference>Process_B</targetReference>
    </defaultConnector>
    <defaultConnectorLabel>Default Path</defaultConnectorLabel>
    <rules>
        <name>Criteria_Met</name>
        <conditions>
            <!-- conditions -->
        </conditions>
        <connector>
            <targetReference>Process_A</targetReference>
        </connector>
        <label>Criteria Met</label>
    </rules>
</decisions>
```

**Note**: Always include `defaultConnectorLabel` even if `defaultConnector` is not used.

### Pattern 3: Collection Processing

```xml
<!-- Get Collection -->
<recordLookups>
    <name>Get_Records</name>
    <getFirstRecordOnly>false</getFirstRecordOnly>
    <queriedFields>Id</queriedFields>
    <queriedFields>Name</queriedFields>
</recordLookups>

<!-- Loop Through Collection -->
<loops>
    <name>Loop_Records</name>
    <collectionReference>Get_Records</collectionReference>
    <nextValueConnector>
        <targetReference>Process_Each</targetReference>
    </nextValueConnector>
</loops>
```

### Pattern 4: Before-Save Field Update

```xml
<start>
    <object>Opportunity</object>
    <recordTriggerType>CreateAndUpdate</recordTriggerType>
    <triggerType>RecordBeforeSave</triggerType>
</start>

<assignments>
    <name>Update_Trigger_Record</name>
    <assignmentItems>
        <assignToReference>$Record.CalculatedField__c</assignToReference>
        <operator>Assign</operator>
        <value>
            <elementReference>FormulaResult</elementReference>
        </value>
    </assignmentItems>
</assignments>
```

---

## Reference Variables

### System Variables

- `$Record`: Triggering record (record-triggered flows)
- `$Record__Prior`: Record before changes (update triggers)
- `$User`: Current running user
- `$Organization`: Current org details
- `$System`: System information

### Global Constants

- `{!$GlobalConstant.True}`: Boolean true
- `{!$GlobalConstant.False}`: Boolean false
- `{!$GlobalConstant.EmptyString}`: Empty string

---

## Value References

### Referencing Elements

```xml
<value>
    <elementReference>VariableName</elementReference>
</value>
```

### Literal Values

```xml
<!-- String -->
<value>
    <stringValue>Text Value</stringValue>
</value>

<!-- Number -->
<value>
    <numberValue>100.0</numberValue>
</value>

<!-- Boolean -->
<value>
    <booleanValue>true</booleanValue>
</value>

<!-- Date -->
<value>
    <dateValue>2025-01-01</dateValue>
</value>

<!-- DateTime -->
<value>
    <dateTimeValue>2025-01-01T12:00:00.000Z</dateTimeValue>
</value>
```

---

## Schema Reference

For complete element definitions, field types, and allowed values, always refer to [flow-schema.md](flow-schema.md). The schema contains:

- All complex types (FlowActionCall, FlowRecordLookup, etc.)
- Simple types and enumerations (FlowDataType, FlowTriggerType, etc.)
- Element hierarchies and inheritance
- Required vs optional fields
- Field data types and constraints

---

## Tips for AI Code Generation

When generating Flow XML:

1. **Always validate element names** against the schema
2. **Include locationX/locationY** for all FlowNode elements
3. **Use proper connectors** to link elements
4. **Set appropriate data types** for variables and formulas
5. **Include required fields** as specified in schema
6. **Use consistent indentation** (2 or 4 spaces)
7. **Add comments** for complex logic
8. **Reference schema** for enumerated values (operators, trigger types, etc.)
9. **Test filter logic** syntax before deployment
10. **Consider governor limits** in design
11. **CRITICAL: Always include `defaultConnectorLabel`** in all decision elements, even when `defaultConnector` is not used - this is mandatory for proper Flow functionality

---

## Example: Complete Flow

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Flow xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>62.0</apiVersion>
    <label>Opportunity Approval Flow</label>
    <processType>Flow</processType>
    <status>Active</status>

    <start>
        <locationX>50</locationX>
        <locationY>0</locationY>
        <connector>
            <targetReference>Get_Opportunity</targetReference>
        </connector>
        <object>Opportunity</object>
        <recordTriggerType>Update</recordTriggerType>
        <triggerType>RecordAfterSave</triggerType>
    </start>

    <recordLookups>
        <name>Get_Opportunity</name>
        <label>Get Opportunity</label>
        <locationX>176</locationX>
        <locationY>134</locationY>
        <assignNullValuesIfNoRecordsFound>false</assignNullValuesIfNoRecordsFound>
        <connector>
            <targetReference>Check_Amount</targetReference>
        </connector>
        <filterLogic>and</filterLogic>
        <filters>
            <field>Id</field>
            <operator>EqualTo</operator>
            <value>
                <elementReference>$Record.Id</elementReference>
            </value>
        </filters>
        <getFirstRecordOnly>true</getFirstRecordOnly>
        <object>Opportunity</object>
        <storeOutputAutomatically>true</storeOutputAutomatically>
    </recordLookups>

    <decisions>
        <name>Check_Amount</name>
        <label>Check Amount</label>
        <locationX>176</locationX>
        <locationY>242</locationY>
        <defaultConnectorLabel>Below Threshold</defaultConnectorLabel>
        <rules>
            <name>Requires_Approval</name>
            <conditionLogic>and</conditionLogic>
            <conditions>
                <leftValueReference>Get_Opportunity.Amount</leftValueReference>
                <operator>GreaterThan</operator>
                <rightValue>
                    <numberValue>100000.0</numberValue>
                </rightValue>
            </conditions>
            <connector>
                <targetReference>Send_Approval_Email</targetReference>
            </connector>
            <label>Requires Approval</label>
        </rules>
    </decisions>

    <actionCalls>
        <name>Send_Approval_Email</name>
        <label>Send Approval Email</label>
        <locationX>176</locationX>
        <locationY>350</locationY>
        <actionName>emailSimple</actionName>
        <actionType>emailSimple</actionType>
        <inputParameters>
            <name>emailAddresses</name>
            <value>
                <stringValue>approver@example.com</stringValue>
            </value>
        </inputParameters>
        <inputParameters>
            <name>emailSubject</name>
            <value>
                <stringValue>Opportunity Requires Approval</stringValue>
            </value>
        </inputParameters>
        <inputParameters>
            <name>emailBody</name>
            <value>
                <stringValue>Opportunity {!Get_Opportunity.Name} requires approval.</stringValue>
            </value>
        </inputParameters>
    </actionCalls>
</Flow>
```

---

## Additional Resources

- **Schema File**: [flow-schema.md](flow-schema.md) - Complete XSD schema definitions
- **Metadata API Guide**: Reference Salesforce Metadata API documentation for latest updates
- **Flow Builder**: Use Flow Builder UI to visualize and validate flows

---

**Note**: This guide covers the most common Flow scenarios. For specialized elements (orchestrated stages, experiments, transformations), refer to the detailed schema definitions in [flow-schema.md](flow-schema.md).
