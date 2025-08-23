import React from 'react';

type ToastItem = { id: number; type: 'success' | 'info' | 'error'; text: string };

const ToastContext = React.createContext<{
  push: (type: ToastItem['type'], text: string) => void;
} | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('ToastProvider missing');
  return ctx;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const idRef = React.useRef(1);
  const push = (type: ToastItem['type'], text: string) => {
    const id = idRef.current++;
    setItems((s) => [...s, { id, type, text }]);
    setTimeout(() => setItems((s) => s.filter((i) => i.id !== id)), 2500);
  };
  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-2 left-1/2 -translate-x-1/2 space-y-2 z-50">
        {items.map((t) => (
          <div
            key={t.id}
            className={
              'px-3 py-2 rounded text-sm shadow font-medium text-white ' +
              (t.type === 'success'
                ? 'bg-green-600'
                : t.type === 'error'
                ? 'bg-red-600'
                : 'bg-slate-700')
            }
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};


