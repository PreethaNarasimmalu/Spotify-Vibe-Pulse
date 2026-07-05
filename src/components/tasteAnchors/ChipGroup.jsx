export default function ChipGroup({ options, selected, max, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option)
        const disabled = !isSelected && selected.length >= max
        return (
          <button
            key={option}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(option)}
            data-testid="taste-chip"
            data-selected={isSelected}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default ${
              isSelected
                ? 'bg-spotify-green border-spotify-green text-black'
                : 'bg-transparent border-[#535353] text-white hover:border-white'
            }`}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}
