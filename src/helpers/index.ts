export const getUserToken = () => localStorage.getItem('userToken');
export const setUserToken = (token: any) => localStorage.setItem('userToken', token);

export const options = () => {
  return { 
    headers: { 
      Authorization: getUserToken()
    }
  }
};