**Salesforce Field creation**

1. Check if the Target Object Exists
   If the object is not mentioned, ask the user:
   “Which object should I create this field on (e.g., Account, Contact, Custom Object)?”
   If its a custom object, confirm its API name ends with **c (e.g., Invoice**c).

2. Field Label vs Field API Name
   Field Label: The display name in the UI (can contain spaces & special characters). Example: Customer Type.
   Field API Name: System name used in code, formulas, queries.
   Auto-generated from the label.
   Spaces become underscores.
   Always ends with **c for custom fields.
   Example: Customer_Type**c.
   Remind user: “Dont manually put spaces in API names. Salesforce handles it with underscores.”

3. Naming Rules
   API Name must be unique per object.
   Avoid reserved keywords (like Type, Name, RecordType).
   Use CamelCase or underscores if multiple words (e.g., Annual_Revenue\_\_c).

4. Choose the Field Type
   Ask the user what type of field they want (Text, Number, Lookup, Picklist, Formula, Checkbox, etc.).
   Confirm additional settings (length, decimal places, required/optional, default value).

5. Validation with User
   Before generating XML, confirm details with the user:
   Object Name (Account, Contact, or Custom)
   Field Label
   Field Type (and subtype details if needed)
   Is it required?
   Default value?
