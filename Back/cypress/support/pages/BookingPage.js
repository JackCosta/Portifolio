import BasePage from "./BasePage";

/** Page Object do recurso /booking. */
class BookingPage extends BasePage {
  constructor() {
    super("/booking");
  }

  list(filters) {
    return this.request({ method: "GET", qs: filters });
  }

  getById(id, headers = {}) {
    return this.request({ method: "GET", path: `/${id}`, headers });
  }

  create(booking, headers = {}) {
    return this.request({ method: "POST", body: booking, headers });
  }

  update(id, booking, authHeaders = {}) {
    return this.request({ method: "PUT", path: `/${id}`, body: booking, headers: authHeaders });
  }

  delete(id, authHeaders = {}, options = {}) {
    return this.request({ method: "DELETE", path: `/${id}`, headers: authHeaders, ...options });
  }
}

export default new BookingPage();
