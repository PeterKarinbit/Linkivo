// Simple Switch component
export const Switch = ({ checked, onChange, id }) => {
  return (
    <button
      type="button"
      id={id}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-green-600' : 'bg-gray-300'}`}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-1'}`}
      />
    </button>
  );
};
