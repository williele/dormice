// class root instance
export const RootInstance = Symbol("dormice:root");
// previous sub on a same keyname, data[]
export const PreviousData = Symbol("dormice:previous_data");
// sub (properties, method, parameters) data, { [key]: data[] }
export const SubData = Symbol("dormice:sub_data");
// take container
export const ParentContainer = Symbol("dormice:parent_containers");

// result, the last data of providers
export const Result = Symbol("dormice:result");
// sub result, the last data of each key objects
export const SubResult = Symbol("dormise:sub_result");
