import moment = require("moment");

export interface BodyField {
  name: string;
  type: "string" | "number" | "date" | "boolean";
  required: boolean;
}

export interface QueryField {
  name: string;
  type: "string" | "number" | "date" | "boolean";
}

export interface ParseError {
  message: string;
  field: string;
}

export class Formatter {
  static isEmptyField(value: any) {
    if (!value) {
      return true;
    }
    value = value.toString();
    let str = value.trim();
    if (str.length == 0) {
      return true;
    }
    return false;
  }
  static parseNotEmptyString(field: string) {
    let trimed = field.trim();
    if (trimed.length == 0 || trimed == "") {
      throw { error: true, message: "Invalid field" };
    } else {
      return trimed;
    }
  }
  static parseDate(dateString: string): Date {
    const supportedFormats = [
      {
        format: "YYYY-MM-DD",
        regex: /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/g,
      },
      {
        format: "DD/MM/YYYY",
        regex: /^[0-9]{2}[\/]{1}[0-9]{2}[\/]{1}[0-9]{4}$/g,
      },
      {
        format: "DD/M/YYYY",
        regex: /^[0-9]{2}[\/]{1}[0-9]{1}[\/]{1}[0-9]{4}$/g,
      },
      {
        format: "D/MM/YYYY",
        regex: /^[0-9]{1}[\/]{1}[0-9]{2}[\/]{1}[0-9]{4}$/g,
      },
      {
        format: "D/M/YYYY",
        regex: /^[0-9]{1}[\/]{1}[0-9]{1}[\/]{1}[0-9]{4}$/g,
      },
      {
        format: "DD-MMM-YYYY",
        regex: /^[0-9]{2}[\/]{1}[0-9]{3}[\/]{1}[0-9]{4}$/g,
      },
      {
        format: "DD-MM-YYYY",
        regex: /^[0-9]{2}[\/]{1}[0-9]{2}[\/]{1}[0-9]{4}$/g,
      },
    ];

    const momentDate: moment.Moment | undefined = moment(
      dateString,
      supportedFormats.map((format) => format.format)
    );

    if (momentDate.isValid()) return momentDate.toDate();

    throw { message: "Invalid field" };
  }
  static parseString(str: string) {
    let parsed = str.trim();
    return parsed;
  }
  static parseNumber(field: any) {
    let str = field.toString();
    if (isNaN(Number(str.trim()))) {
      throw {
        message: "Invalid field",
      };
    } else {
      return Number(str);
    }
  }

  static parseBoolean(field: any) {
    if (field === "false") {
      return false;
    }
    if (field === "true") {
      return true;
    }
    if (field) {
      return true;
    } else return false;
  }

  //In case of new data type add parse method and type to query and body interfaces
  static parseField(itemToParse: any, fieldType: string) {
    switch (fieldType) {
      case "date":
        return Formatter.parseDate(itemToParse);
      case "string":
        return Formatter.parseString(itemToParse);
      case "number":
        return Formatter.parseNumber(itemToParse);
      case "boolean":
        return Formatter.parseBoolean(itemToParse);
    }
  }

  static checkBodyFieldsAndReplace(
    entity: any,
    bodyToParse: any,
    fields: Array<BodyField>
  ) {
    let errors: Array<ParseError> = [];
    for (let i = 0; i < fields.length; i++) {
      let field = fields[i];
      try {
        if (Formatter.isEmptyField(bodyToParse[field.name])) {
          if (field.required) {
            throw { message: "Missing field" };
          } else {
            continue;
          }
        }
        entity[field.name] = Formatter.parseField(
          bodyToParse[field.name],
          field.type
        );
      } catch (error) {
        errors.push({ field: field.name, message: error.message });
      }
    }
    return { entity, errors };
  }

  static checkQueryFieldsAndReplace(
    entity: any,
    queryToParse: any,
    fields: Array<QueryField>
  ) {
    let errors: Array<ParseError> = [];
    for (let i = 0; i < fields.length; i++) {
      let field = fields[i];
      try {
        if (Formatter.isEmptyField(queryToParse[field.name])) {
          continue;
        }
        entity[field.name] = Formatter.parseField(
          queryToParse[field.name],
          field.type
        );
      } catch (error) {
        errors.push({ field: field.name, message: error.message });
      }
    }
    return { entity, errors };
  }
}
