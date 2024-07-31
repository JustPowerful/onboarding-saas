export default function formatDateString(dateString: string | Date) {
  // Parse the date string into a Date object
  const date = new Date(dateString)

  // Define month names
  const monthNames = [
    'jan.',
    'feb.',
    'mar.',
    'avr.',
    'mai',
    'jun.',
    'jul.',
    'août',
    'sep.',
    'oct.',
    'nov.',
    'déc.'
  ]

  // Get individual components
  const day = date.getUTCDate()
  const month = monthNames[date.getUTCMonth()]
  let hours = date.getUTCHours()
  const minutes = date.getUTCMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'

  // Format hours to 12-hour format
  hours = hours % 12
  hours = hours ? hours : 12 // the hour '0' should be '12'

  // Format minutes to ensure two digits
  const minutesFormatted = minutes < 10 ? '0' + minutes : minutes

  // Construct the formatted date string
  const formattedDate = `${month}, avril ${day}th ${hours}:${minutesFormatted}${ampm}`

  return formattedDate
}
