import { Link } from 'react-router-dom'

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-600">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 mt-4 mb-4">Page not found</h2>
        <p className="text-gray-600 mb-8">Sorry, we couldn't find the page you're looking for.</p>
        <Link to="/" className="btn btn-primary">
          Go back home
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage