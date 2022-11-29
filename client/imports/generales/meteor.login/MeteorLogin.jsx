
import { Meteor } from 'meteor/meteor'; 
import { useTracker } from 'meteor/react-meteor-data'

import React, { useState, useEffect } from 'react'; 
import PropTypes from 'prop-types';

import SignOut_Modal from "./SignOut_Modal"; 
import SignIn_Modal from "./SignIn_Modal"; 
import ChangeUserName_Modal from "./ChangeUserName_Modal"; 
import ChangeUserEmail_Modal from "./ChangeUserEmail_Modal"; 
import CreateAccount_Modal from "./CreateAccount_Modal"; 
import VerifyUserEmail_Modal from "./VerifyUserEmail_Modal"; 
import ResetUserPassword_Modal from "./ResetUserPassword_Modal"; 
import ForgotUserPassword_Modal from "./ForgotUserPassword_Modal"; 

import Spinner from '/client/imports/genericReactComponents/Spinner';

const MeteorLogin = ({ goToHomeFunction }) => { 

    const [user, setUser] = useState({}); 
    const [showModal, setShowModal] = useState(false); 
    const [showSpinner, setShowSpinner] = useState(true);

    // para saber cuando el usuario quiere: cambiar nombre del usuario; agregar cuenta; reset password; ect. 
    const [specialAction, setSpecialAction] = useState(null); 

    useTracker(() => { 
        const currUser = Meteor.user(); 

        if (currUser && currUser._id) {
            setUser(() => currUser);
            setShowSpinner(false); 
        } else {
            setUser(() => { });
            // solo cuando Meteor.user() regresa Null es que se ha determinado que no hay un usuario autenticado
            // si el valor es undefined, es que aún está trabajando para obtener el usuario (o ninguno)
            if (currUser === null) {
                setShowSpinner(false);
            }
        }
    }, []);

    useEffect(() => {
        if (specialAction) { 
            // cuando el usuario quiere un special action, como cambiar user name o create account, 
            // abrimos otro modal de inmediato, sin que el usuario haga click en el login link 
            setShowModal(true); 
        }
    }, [ specialAction ])

    let userName = "Sign in"; 
    let modalType = ""; 
    
    if (!specialAction) { 
        // las acciones no especiales serían: login y logout 
        if (user && user.username) {

            if (user.emails.length) { 
                const email = user.emails[0];
                userName = email.verified ? user.username : `${user.username} (verifique ${email.address})`;
            } else { 
                userName = user.username; 
            }
            
            modalType = "signOut";
        } else if (user && user.emails && user.emails.length) {
            const email = user.emails[0]; 

            userName = email.verified ? email.address : `${email.address} (verifique ${email.address})`;
            modalType = "signOut";
        } else {
            modalType = "signIn";
        }
    } else { 
        // las acciones especiales serían: crear cuenta; reset password; cambiar user name ... 
        if (specialAction === "changeUserName") { 
            userName = user && user.username ? user.username : user.emails[0].address; 
            modalType = "changeUserName";
        } else if (specialAction === "createNewAccount") { 
            modalType = "createNewAccount"; 
        } else if (specialAction === "changeUserEmail") { 
            userName = user && user.username ? user.username : user.emails[0].address; 
            modalType = "changeUserEmail"; 
        } else if (specialAction === "verificarUserEmail") { 
            userName = user && user.username ? user.username : user.emails[0].address; 
            modalType = "verificarUserEmail"; 
        } else if (specialAction === "resetUserPassword") { 
            userName = user && user.username ? user.username : user.emails[0].address;
            modalType = "resetUserPassword"; 
        } else if (specialAction === 'forgotUserPassword') { 
            modalType = "forgotUserPassword"; 
        }
    }
    
    return (
        <>
            {/* de acuerdo a la función que quiera el usuario, mostramos un tipo de modal  */}
            { showModal && (modalType === "signOut") && <SignOut_Modal showModal={showModal} 
                                                                       setShowModal={setShowModal} 
                                                                       setSpecialAction={setSpecialAction} 
                                                                       // nota: este es el angular scope 
                                                                       // lo pasamos para hacer un $scope.go('/') e ir al home de la aplicación 
                                                                       goToHomeFunction={goToHomeFunction} /> }

            { showModal && (modalType === "signIn") && <SignIn_Modal showModal={showModal} 
                                                                     setShowModal={setShowModal} 
                                                                     setSpecialAction={setSpecialAction} /> }

            { showModal && (modalType === "changeUserName") && <ChangeUserName_Modal showModal={showModal} 
                                                                                     setShowModal={setShowModal}
                                                                                     setSpecialAction={setSpecialAction} /> }

            { showModal && (modalType === "changeUserEmail") && <ChangeUserEmail_Modal showModal={showModal}
                                                                                       setShowModal={setShowModal}
                                                                                       setSpecialAction={setSpecialAction} /> }

            { showModal && (modalType === "createNewAccount") && <CreateAccount_Modal showModal={showModal}
                setShowModal={setShowModal}
                setSpecialAction={setSpecialAction} /> }

            { showModal && (modalType === "verificarUserEmail") && <VerifyUserEmail_Modal showModal={showModal}
                                                                                          setShowModal={setShowModal}
                                                                                          setSpecialAction={setSpecialAction} /> }

            { showModal && (modalType === "resetUserPassword") && <ResetUserPassword_Modal showModal={showModal}
                                                                                           setShowModal={setShowModal}
                                                                                           setSpecialAction={setSpecialAction} /> }

            { showModal && (modalType === "forgotUserPassword") && <ForgotUserPassword_Modal showModal={showModal}
                                                                                            setShowModal={setShowModal}
                                                                                            setSpecialAction={setSpecialAction} />}

            <a href="#" onClick={() => setShowModal(true)}>
                {
                    showSpinner 
                        ? 
                            <Spinner /> 
                        : 
                            <span style={{ textDecoration: 'underline' }}>
                                {userName}
                                &nbsp;&nbsp;
                                <span style={{ fontSize: 'xx-small' }}
                                    className="glyphicon glyphicon-triangle-bottom" />
                            </span>
                }
                
            </a>
        </>
    )
}

MeteorLogin.propTypes = {
    goToHomeFunction: PropTypes.func       // este es el angular $scope 
};

export default MeteorLogin; 