interface AnimatedHeaderProps {
  children?: React.ReactNode;
  className?: string;
}

export default function AnimatedHeader({ children, className = "" }: AnimatedHeaderProps) {
  return (
    <header className={`animated-header ${className}`}>
      {children}
    </header>
  );
}