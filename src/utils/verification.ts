export const generateVerificationCode = (length: number = 6): string => {
  const min = Math.pow(10, length - 1)
  const max = Math.pow(10, length) - 1
  return Math.floor(Math.random() * (max - min + 1) + min)
    .toString()
    .padStart(length, '0')
}
