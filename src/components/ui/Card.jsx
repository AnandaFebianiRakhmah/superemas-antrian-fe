export function Card({
  title,
  value,
  icon,
  subtitle,
  className = '',
  children,
  ...props
}) {
  return (
    <div
      className={`glass-card p-5 ${className}`}
      {...props}
    >
      {(title || icon) && (
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            {title && (
              <p className="text-xs font-medium text-navy-300 uppercase tracking-wider">
                {title}
              </p>
            )}
            {value !== undefined && (
              <p className="text-3xl font-bold text-white mt-1">{value}</p>
            )}
            {subtitle && (
              <p className="text-xs text-navy-400 mt-1">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className="w-11 h-11 rounded-lg bg-navy-700/60 flex items-center justify-center flex-shrink-0">
              {icon}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
