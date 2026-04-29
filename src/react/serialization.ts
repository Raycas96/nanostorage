export const defaultSerializer = <T>(value: T): string => JSON.stringify(value);

export const defaultDeserializer = <T>(raw: string | null): T | null => {
	if (raw === null) {
		return null;
	}

	try {
		return JSON.parse(raw) as T;
	} catch {
		return null;
	}
};
