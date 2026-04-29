export type SetValueAction<T> = T | ((prev: T | null) => T);

export type SetValueFn<T> = (value: SetValueAction<T>) => void;
