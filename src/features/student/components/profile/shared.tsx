export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0, 0, 0.2, 1] as const },
  }),
};

export function SectionHeader({
  icon: Icon,
  gradient,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  gradient: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2.5 sm:mb-4 sm:gap-3 md:mb-6">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br sm:h-11 sm:w-11 ${gradient} text-white shadow-lg`}
      >
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <div>
        <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}
