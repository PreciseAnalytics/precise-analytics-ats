const sizes = {
  mobile: '48rem',
  tablet: '76.8rem', 
  desktop: '102.4rem',
};

export const media = {
  mobile: (styles: string) => `@media (max-width: ${sizes.mobile}) { ${styles} }`,
  tablet: (styles: string) => `@media (max-width: ${sizes.tablet}) { ${styles} }`,
  desktop: (styles: string) => `@media (max-width: ${sizes.desktop}) { ${styles} }`,
};

// Media query utility for styled-components (mq function that careers page expects)
export const breakpoints = {
  mobile: '480px',
  tablet: '768px',
  desktop: '1024px',
  largeDesktop: '1200px',
};

export const mq = (query: string, styles: string) => {
  const breakpoint = query.replace('<=', '').replace('>=', '');
  const operator = query.includes('<=') ? 'max-width' : 'min-width';
  
  const bpValue = breakpoints[breakpoint as keyof typeof breakpoints] || breakpoint;
  
  return `
    @media screen and (${operator}: ${bpValue}) {
      ${styles}
    }
  `;
};