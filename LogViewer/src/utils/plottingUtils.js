export const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }

  // Validate the generated color
  if (!/^#[0-9A-F]{6}$/i.test(color)) {
    console.error(`Generated color ${color} does not conform to the required format #rrggbb`);
    return '#000000'; // default to black if validation fails
  }

  return color;
};
