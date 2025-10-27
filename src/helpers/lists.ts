export const optionTodoList: string[] = [
  "Asamblea de las sombras",
  "Mazmorras aleatorias",
  "Recolectar escencia de monstruo",
  "Misiones diarias",
  "Campo de batalla",
];

export const translateResult = (result: string | undefined) => {
  switch (result) {
    case 'victory':
      return 'Victoria';
    case 'defeat':
      return 'Derrota';
    case 'draw':
      return 'Empate';
    case 'pending':
      return 'Pendiente';
    default:
      return 'Pendiente';
  }
};

export const translateBattle = (battle: string | undefined) => {
  switch (battle) {
    case 'exalted':
      return 'Sublime';
    case 'eminent':
      return 'Eminente';
    case 'famed':
      return 'Célebre';
    case 'proud':
      return 'Imponente';
    default:
      return;
  }
};
