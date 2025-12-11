import jobTaxonomyTool from './lightcast.tool.js';

const tools = {
  [jobTaxonomyTool.name]: jobTaxonomyTool
};

const getTool = (toolName) => {
  return tools[toolName];
};

const getAllTools = () => {
  return Object.values(tools);
};

export {
  getTool,
  getAllTools
};
