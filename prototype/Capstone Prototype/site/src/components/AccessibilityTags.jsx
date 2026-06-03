import { Accessibility, Toilet, Dog, Brain } from "lucide-react";

const TAG_CONFIG = {
  wheelchair_accessible: {
    label: "Wheelchair Accessible",
    icon: Accessibility,
    className: "bg-blue-100 text-blue-700"
  },
  gender_neutral_restroom: {
    label: "Gender Neutral Restroom",
    icon: Toilet,
    className: "bg-purple-100 text-purple-700"
  },
  sensory_friendly: {
    label: "Sensory Friendly",
    icon: Brain,
    className: "bg-yellow-100 text-yellow-700"
  },
  dog_friendly: {
    label: "Dog Friendly",
    icon: Dog,
    className: "bg-orange-100 text-orange-700"
  }
};

export default function AccessibilityTags({ tags = [] }) {
  if (!tags.length) return null;

  return (
    <div className="flex flex-wrap gap-1" aria-label="Accessibility features">
      {tags.map((tag) => {
        const config = TAG_CONFIG[tag];
        if (!config) return null;
        const Icon = config.icon;
        return (
          <span
            key={tag}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}
            title={config.label}
          >
            <Icon size={11} aria-hidden="true" />
            {config.label}
          </span>
        );
      })}
    </div>
  );
}
