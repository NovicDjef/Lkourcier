import apiService from "./api";

// Requetes GET
  export const getchSomeRestaurant = () => {
    return apiService.get('/restaurants')
  }
  export const getchSomeMenu = () => {
    return apiService.get('/menus')
  };
  export const getchSomeRepas = () => {
    return apiService.get('/plats');
  };
  // export const getchSomeUser = () => {
  //   return apiService.get('/users')
  // }
  export const getchSomePriceCommande = () => {
    return apiService.get('/prixcommande')
  }

  export const getchSomeComplements = () => {
    return apiService.get('/complements')
  }

  export const getchSomePriceColis = () => {
    return apiService.get('/prixcolis')
  }
  export const getchSomeNotification = () => {
    return apiService.get('/notifications')
  }
  export const getchSomeUser = ({phone}) => {
    return apiService.post('/usersIdByPhone', { phone: phone})
  }
 
  export const getchSomeslide = () => {
    return apiService.get('/slides');
  };
  export const getchSomeGeolocation = () => {
    return apiService.get("/geolocalisations")
  }
  export const getchSomeCategories = () => {
    return apiService.get('/categories')
  };
  // export const getSomeCommande = (userId) => {
  //   return apiService.get(`/commandes/${userId}`)
  
  // };
  export const getSomeCommande = () => {
    return apiService.get("/commandes")
  };
  export const getchSomeLivraisons = () => {
    return apiService.get("/livraisons")
  };
  export const getchSomeVille = () => {
    return apiService.get("/villes")
  }

  export const getchSomeSlide = () => {
    return apiService.get("/slides")
  }
  
  // resquete POST :
  
  
  export const fetchSomeGeolocation = (geolocationData) => {
    return apiService.post('/geolocalisation', { geolocationData: geolocationData })
  };

  // const commande = cart.map(item => ({
  //   quantity: item.quantity,
  //   userId: userId, /* ID de l'utilisateur, à remplacer par la valeur réelle */
  //   platsId: item.id, 
    
  // }));

  export const fetchSomeLoginLivreur = (identifier, password) => {
    const isEmail = identifier.includes('@');
  
  const loginData = {
    password,
    ...(isEmail ? { email: identifier } : { telephone: identifier })
  };
    
    return apiService.post('/livreur/login', loginData)
  }

  export const fetchSomeRegisterLivreur = async (userData) => {
    try {
      const cleanData = {
        username: userData.username,
        prenom: userData.prenom,
        email: userData.email,
        password: userData.password,
        telephone: userData.telephone
      };
    return apiService.post('/livreur/signup', cleanData)
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      throw error;
    }
  }

  export const fetchSomeVerifyToken = (token) => {
    return apiService.post('/admin/verify', { token })
  }
  
  export const addSomePayement = (paymentData) => {
    console.debug("paymentDatafffff :", paymentData)
      return apiService.post('/payement', {paymentData: paymentData})
  }

  export const addSomeCommande = (commandeData) => {
    console.debug("paymentDatafffff :", commandeData)
    return apiService.post("/commandes", {commandeData: commandeData})
  }

  export const fetchSomeAdressLivraison = (adresse) => {
    console.debug("Adresse de livraion: ", adresse);
    return apiService.post('/livraison', {adresse: adresse})
  }

  export const fetchSomeUser = () => {
    return apiService.get('/users')
  }

  export const fetchSomePhone = ({username, phone}) => {
    console.log("username, phone : ", phone, username)
      return apiService.post('/signup', { username, phone });
     
  };
  
  // export const fetchSomePhone = async ({ username, phone }) => {
  //   try {
  //     const response = await apiService.post('/register', { username, phone });
      
  //     // Vérifiez le statut HTTP de la réponse
  //     if (response.status >= 400) {
  //       const errorData = await response.json();
  //       console.error('Erreur dans fetchSomePhone:', errorData.message);
  //       throw new Error(errorData.message || 'Une erreur s\'est produite');
  //     }
  
  //     // Retourner les données si tout va bien
  //     return response.data;
  //   } catch (error) {
  //     console.error('Erreur dans fetchSomePhone:', error);
  //     throw error; // Propagation de l'erreur pour qu'elle soit traitée dans le Redux action
  //   }
  // };
  

  export const fetchSomeValidateOTP = (otpCode, phone) => {
    return apiService.post('/verify-otp', { code: otpCode, phone })
  }
  
  export const fetchSomeGame = ({lotId, userId, selectedNumbers, isWinner}) => {
    return apiService.post('./games', {lotId, userId, selectedNumbers, isWinner})
  }

  // Request UPDATE

  export const updateSomePhone = (id, { username, phone }) => {
    return apiService.patch(`/update-user/${id}`, { username, phone });
  };

  export const updateSomeSatus = (id) => {
    return apiService.patch(`/commande/${id}`);
  };
  
  

