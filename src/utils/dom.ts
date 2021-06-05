export const joinClasses = (
  existingClasses: string,
  ...newClasses: (string | undefined)[]
) => {
  const isClassName = (className?: string): className is string => !!className;
  return existingClasses
    .split(" ")
    .concat(newClasses.filter(isClassName))
    .join(" ");
};
