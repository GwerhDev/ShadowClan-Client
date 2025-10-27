const defaultValue = { 
  style: {
      transform: '',
      display: '',
      opacity: '', 
      filter: '', 
      scale: '', 
      overflowY: '',
      transitionDuration: '',
      transformOrigin: '',
      transformStyle: '',
      transitionTimingFunction: '',
      transformBox: '',
      transitionDelay: '',
      transitionProperty: '',
  },
  contains() {
    return;
  }
};

export const $d = (e: string) => {
  const element: any = document.querySelector(e);
  if (element) {
    return element;
  }
  return defaultValue;
};

export const $gId = (e: string) => {
  const element = document.getElementById(e);
  if (element) {
    return element;
  }
  return defaultValue;
};

export const $display = (e: string) => {
  const element: any = $d(e);
  if (element.style.display === "flex") return element.style.display = "none";
  return element.style.display = "flex";
};

export const scrollToTop = () => {
  window.scrollTo(0, 0);
};

