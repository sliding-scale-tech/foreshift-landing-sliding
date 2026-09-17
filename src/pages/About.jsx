import AboutHero from '../components/about/AboutHero'
import Aspiration from '../components/about/Aspiration'
import FoundersNote from '../components/about/FoundersNote'
import Mission from '../components/about/Mission'
import { AboutLayout } from '../components/Layouts'

export default function About() {
  return (
    <AboutLayout>
      <AboutHero />
      <Aspiration />
      <Mission />
      <FoundersNote />
    </AboutLayout>
  )
}
