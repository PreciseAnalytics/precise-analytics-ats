export const metadata = {
  title: 'Precise Analytics ATS',
  description: 'Applicant Tracking System for Precise Analytics',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="antialiased min-h-screen bg-gray-50">{children}</body>
    </html>
  )
}