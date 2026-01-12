import React, { useContext, useState } from 'react'
import assets from '../assets/assets'
import { AuthContext } from '../../context/AuthContext'

const LoginPage = () => {

  const [currentState, setCurrentState] = useState("Sign Up")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [bio, setBio] = useState("")
  const [isDataSubmitted, setIsDataSubmitted] = useState(false)

  const {login} = useContext(AuthContext);

  const onSubmitHandler = (event)=>{
    event.preventDefault();

    if (currentState === 'Sign Up' && !isDataSubmitted) {
      setIsDataSubmitted(true)
      return;
    }
    login(currentState === "Sign Up" ? "signup" : "login", 
      {fullName, email, password, bio})
  }

  return (
    <div className="min-h-screen bg-cover bg-center flex flex-col sm:flex-row items-center justify-center gap-6 px-4 backdrop-blur-2xl">

      {/* Logo */}
      <img
        src={assets.logo_big}
        alt="Logo"
        className="w-40 sm:w-[250px]"
      />

      {/* Form */}
      <form onSubmit={onSubmitHandler} className="w-full max-w-sm sm:max-w-md bg-white/10 text-white border border-gray-500 p-6 sm:p-8 rounded-lg shadow-lg flex flex-col gap-5">

        <h2 className="text-2xl font-medium flex justify-between items-center">
          <span>{currentState}</span>
          {isDataSubmitted && (
            <img
              src={assets.arrow_icon}
              className="w-5 cursor-pointer"
              onClick={() => setIsDataSubmitted(false)}
            />
          )}
        </h2>


        {/* Full Name */}
        {currentState === "Sign Up" && !isDataSubmitted && (
          <input
            onChange={(e) => setFullName(e.target.value)}
            value={fullName}
            type="text"
            placeholder="Full Name"
            required
            className="p-3 rounded-md border border-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        )}

        {/* Email & Password */}
        {!isDataSubmitted && (
          <>
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              type="email"
              placeholder="Email Address"
              required
              className="p-3 rounded-md border border-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />

            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              type="password"
              placeholder="Password"
              required
              className="p-3 rounded-md border border-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </>
        )}

        {/* Bio */}
        {currentState === "Sign Up" && isDataSubmitted && (
          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            rows={4}
            placeholder="Provide a short bio..."
            required
            className="p-3 rounded-md border border-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        )}

        {/* Button */}
        <button
          type="submit"
          className="py-3 rounded-md bg-gradient-to-r from-purple-500 to-violet-600 font-medium text-white hover:opacity-90 transition"
        >
          {currentState === "Sign Up" ? "Create Account" : "Login Now"}
        </button>

        {/* Terms */}
        <div className="flex items-center gap-2 text-xs text-gray-300">
          <input type="checkbox" />
          <p>Agree to the terms & privacy policy</p>
        </div>

        {/* Toggle */}
        <p className="text-sm text-center text-gray-300">
          {currentState === "Sign Up" ? (
            <>
              Already have an account?{" "}
              <span
                onClick={() => {setCurrentState("Login"); setIsDataSubmitted(false)}}
                className="text-violet-400 cursor-pointer font-medium"
              >
                Login here
              </span>
            </>
          ) : (
            <>
              Create an account{" "}
              <span
                onClick={() => setCurrentState("Sign Up")}
                className="text-violet-400 cursor-pointer font-medium"
              >
                Click here
              </span>
            </>
          )}
        </p>

      </form>
    </div>
  )
}

export default LoginPage
