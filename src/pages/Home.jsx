import { HomeLayout } from '../components/Layouts'
import Counters from '../components/home/Counters'
import EarlyAccessForm from '../components/home/EarlyAccessForm'
import FeatureSlider from '../components/home/FeatureSlider'
import Hero from '../components/home/Hero'
import HowItWorks from '../components/home/HowItWorks'
import Marquee from '../components/home/Marquee'
import Pricing from '../components/home/Pricing'
import ProblemSection from '../components/home/ProblemSection'
import SolutionSection from '../components/home/SolutionSection'

// Port of reference/original/index.html (body between navbar and footer), section order preserved.
export default function Home() {
  return (
    <HomeLayout>
      <Hero />
      <Marquee />
      <ProblemSection />
      <SolutionSection />
      <FeatureSlider />
      <Counters />
      <HowItWorks />
      <Pricing />
      <EarlyAccessForm />
    </HomeLayout>
  )
}
