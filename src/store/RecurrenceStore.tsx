import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { RECURRENCE_EXAMPLES } from '../recurrence/examples';
import { formatRecurrenceFormula } from '../recurrence/generateSequence';
import { validateRecurrenceConfig, type RecurrenceFormValues } from '../recurrence/recurrenceValidation';
import type { RecurrenceConfig, SavedRecurrence, SequenceRecord } from '../types/recurrence';
import { generateId } from '../utils/graph';
import { readStorage, STORAGE_KEYS, writeStorage } from '../utils/storage';

const MAX_RECENT = 8;

interface RecurrenceStoreValue {
  /** Text currently typed into the form (persisted so a refresh does not lose it). */
  form: RecurrenceFormValues;
  setForm: (updater: RecurrenceFormValues | ((f: RecurrenceFormValues) => RecurrenceFormValues)) => void;
  /** Configuration of the most recent successful "Generate". */
  lastGenerated: RecurrenceConfig | null;
  recordGeneration: (config: RecurrenceConfig, terms: number[]) => void;
  savedConfigs: SavedRecurrence[];
  saveConfig: (name: string, config: RecurrenceConfig) => void;
  deleteConfig: (id: string) => void;
  recentSequences: SequenceRecord[];
}

const RecurrenceStoreContext = createContext<RecurrenceStoreValue | null>(null);

export function configToForm(config: RecurrenceConfig): RecurrenceFormValues {
  return {
    coefficients: config.coefficients.map(String),
    initial: config.initial.map(String),
    count: String(config.count),
  };
}

const isConfig = (raw: unknown): raw is RecurrenceConfig => {
  if (typeof raw !== 'object' || raw === null) return false;
  const c = raw as RecurrenceConfig;
  return Array.isArray(c.coefficients) && Array.isArray(c.initial) && typeof c.count === 'number' && validateRecurrenceConfig(c).length === 0;
};

const parseForm = (raw: unknown): RecurrenceFormValues | null => {
  if (typeof raw !== 'object' || raw === null) return null;
  const f = raw as RecurrenceFormValues;
  const strings = (a: unknown): a is string[] => Array.isArray(a) && a.every((x) => typeof x === 'string');
  return strings(f.coefficients) && strings(f.initial) && typeof f.count === 'string' ? f : null;
};

const parseSaved = (raw: unknown): SavedRecurrence[] | null =>
  Array.isArray(raw)
    ? raw.filter((r): r is SavedRecurrence => typeof r === 'object' && r !== null && typeof (r as SavedRecurrence).id === 'string' && typeof (r as SavedRecurrence).name === 'string' && isConfig((r as SavedRecurrence).config))
    : null;

const parseRecent = (raw: unknown): SequenceRecord[] | null =>
  Array.isArray(raw)
    ? raw.filter((r): r is SequenceRecord => typeof r === 'object' && r !== null && typeof (r as SequenceRecord).id === 'string' && isConfig((r as SequenceRecord).config) && Array.isArray((r as SequenceRecord).preview))
    : null;

export function RecurrenceStoreProvider({ children }: { children: ReactNode }) {
  const [form, setFormState] = useState<RecurrenceFormValues>(() =>
    readStorage(STORAGE_KEYS.recurrenceForm, parseForm, configToForm(RECURRENCE_EXAMPLES[0].config)),
  );
  const [lastGenerated, setLastGenerated] = useState<RecurrenceConfig | null>(() =>
    readStorage<RecurrenceConfig | null>(STORAGE_KEYS.lastRecurrence, (raw) => (isConfig(raw) ? raw : null), null),
  );
  const [savedConfigs, setSavedConfigs] = useState<SavedRecurrence[]>(() => readStorage(STORAGE_KEYS.savedRecurrences, parseSaved, []));
  const [recentSequences, setRecent] = useState<SequenceRecord[]>(() => readStorage(STORAGE_KEYS.recentSequences, parseRecent, []));

  useEffect(() => void writeStorage(STORAGE_KEYS.recurrenceForm, form), [form]);
  useEffect(() => void writeStorage(STORAGE_KEYS.lastRecurrence, lastGenerated), [lastGenerated]);
  useEffect(() => void writeStorage(STORAGE_KEYS.savedRecurrences, savedConfigs), [savedConfigs]);
  useEffect(() => void writeStorage(STORAGE_KEYS.recentSequences, recentSequences), [recentSequences]);

  const setForm = useCallback((u: RecurrenceFormValues | ((f: RecurrenceFormValues) => RecurrenceFormValues)) => setFormState(u), []);

  const recordGeneration = useCallback((config: RecurrenceConfig, terms: number[]) => {
    setLastGenerated(config);
    const key = JSON.stringify(config);
    setRecent((list) => {
      const rest = list.filter((r) => JSON.stringify(r.config) !== key);
      const record: SequenceRecord = {
        id: generateId('seq'),
        formula: formatRecurrenceFormula(config.coefficients),
        config,
        generatedAt: new Date().toISOString(),
        preview: terms.slice(0, 10),
      };
      return [record, ...rest].slice(0, MAX_RECENT);
    });
  }, []);

  const saveConfig = useCallback((name: string, config: RecurrenceConfig) => {
    setSavedConfigs((list) => [...list, { id: generateId('rec'), name, config, savedAt: new Date().toISOString() }]);
  }, []);
  const deleteConfig = useCallback((id: string) => setSavedConfigs((list) => list.filter((s) => s.id !== id)), []);

  const value = useMemo<RecurrenceStoreValue>(
    () => ({ form, setForm, lastGenerated, recordGeneration, savedConfigs, saveConfig, deleteConfig, recentSequences }),
    [form, setForm, lastGenerated, recordGeneration, savedConfigs, saveConfig, deleteConfig, recentSequences],
  );
  return <RecurrenceStoreContext.Provider value={value}>{children}</RecurrenceStoreContext.Provider>;
}

export function useRecurrenceStore(): RecurrenceStoreValue {
  const ctx = useContext(RecurrenceStoreContext);
  if (!ctx) throw new Error('useRecurrenceStore must be used inside <RecurrenceStoreProvider>');
  return ctx;
}
