// class root instance
export const RootInstance = Symbol("dormice:root");
// previous sub on a same keyname, data[]
export const PreviousData = Symbol("dormice:privous_data");
// sub (properties, method, parameters) data, { [key]: data[] }
export const SubData = Symbol("dormice:sub_data");
// take container
export const ParentContainer = Symbol("dormice:parent_containers");
