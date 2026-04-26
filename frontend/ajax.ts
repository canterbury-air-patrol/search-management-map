import $ from 'jquery'

const AJAX_TIMEOUT = 2500

function smmGet(url: string, data?: object, success?: (data: unknown) => void, error?: () => void) {
  return $.ajax({
    url,
    data,
    timeout: AJAX_TIMEOUT,
    success: success,
    error: error
  })
}

function smmGetJSON(url: string, data?: object, success?: (data: unknown) => void, error?: () => void) {
  return $.ajax({
    url,
    data,
    dataType: 'json',
    timeout: AJAX_TIMEOUT,
    success: success,
    error: error
  })
}

function smmPost(url: string, data: object, success?: (data: unknown) => void, error?: () => void) {
  return $.ajax({
    url,
    type: 'POST',
    data: data,
    timeout: AJAX_TIMEOUT,
    success: success,
    error: error
  })
}

export { smmGet, smmGetJSON, smmPost }
