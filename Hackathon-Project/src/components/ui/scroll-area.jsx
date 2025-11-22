import * as React from "react"

const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #CBD5E1;
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94A3B8;
  }
`;

const ScrollArea = React.forwardRef(({ className, children, ...props }, ref) => {
  React.useEffect(() => {
    // Inject styles once
    if (!document.getElementById('scrollbar-styles')) {
      const style = document.createElement('style');
      style.id = 'scrollbar-styles';
      style.innerHTML = scrollbarStyles;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div
      ref={ref}
      className={`custom-scrollbar relative overflow-auto ${className || ''}`}
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#CBD5E1 transparent',
      }}
      {...props}
    >
      {children}
    </div>
  );
});

ScrollArea.displayName = "ScrollArea"

export { ScrollArea }

