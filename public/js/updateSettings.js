// updateData
import { showAlert } from './alerts';

// type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? 'http://localhost:3000/api/v1/users/updatePassword'
        : 'http://localhost:3000/api/v1/users/updateMe';

    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });

    // console.log(res.data);
    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully!`);
      // window.setTimeout(() => {
      //   location.assign('/me');
      // }, 1500);
    }
  } catch (err) {
    // console.log(err.response);
    showAlert('error', err.response.data.message);
  }
};
