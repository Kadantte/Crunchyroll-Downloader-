import React, {useContext} from "react"
import {WebsiteContext} from "../renderer"
import crLogo from "../assets/crunchyroll/logobar.png"
import hiLogo from "../assets/hidive/logobar.png"
import fuLogo from "../assets/funimation/logobar.png"
import "../styles/logobar.less"

const LogoBar: React.FunctionComponent = (props) => {
    const {website, setWebsite} = useContext(WebsiteContext)
    
    const getLogo = () => {
        if (website === "crunchyroll") {
            return crLogo
        } else if (website === "hidive") {
            return hiLogo
        } else if (website === "funimation") {
            return fuLogo
        }
    }

    return (
        <section className="logo-bar">
            <div className="logo-bar-drag">
                <img src={getLogo()} className="logo" width="487" height="77"/>
            </div>
        </section>
    )
}

export default LogoBar