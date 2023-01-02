function addToCart(proId) {
    $.ajax({
        url: '/add-to-cart/' + proId,
        method: 'get',
        success: (response) => {
            if (response.status) {
                let count = $("#cart-count").html()
                count = parseInt(count) + 1
                $("#cart-count").html(count)
            }
        }
    })
}

$("#checkout-form").submit((e) => {
    e.preventDefault()
    $.ajax({
        url: '/place-order',
        method: 'post',
        data: $("#checkout-form").serialize(),
        success: (response) => {
            if (response.codSuccess) {
                location.href = '/order-success';
            } else {
                razorpayPayment(response)
            }
        }
    })
})
function razorpayPayment(order) {
    var options = {
        "key": "rzp_test_EIWgZj77vaDhMf", // Enter the Key ID generated from the Dashboard
        "amount": order.total * 100, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",
        "name": "Thaha",
        "description": "Testing Transaction",
        "image": "https://example.com/your_logo",
        "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        "handler": function (response){
            // alert(response.razorpay_payment_id);
            // alert(response.razorpay_order_id);
            // alert(response.razorpay_signature)
            verifyPayment(response,order)
        },
        "prefill": {
            "name": "Gaurav Kumar",
            "email": "gaurav.kumar@example.com",
            "contact": "9999999999"
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#3399cc"
        }
    };
    var rzp1 = new Razorpay(options);
    //  document.getElementById('rzp-button1').onclick = function (e) {
    rzp1.open();
    //    e.preventDefault();
    //  }
}
function verifyPayment(payment,order) {
    $.ajax({
        url: '/verify-payment',
        data: {
            payment,
            order
        },
        method: 'post',
        success: (response) => {
            if (response.status) {
                location.href = 'order-success'
            } else {
                alert('payment unsuccessfull')
            }
        }
    })
}
function logoutUser(){
    const conf = confirm('Are you sure Logout..?')
    if(conf){
        location.href='/logout'
    }
}
function logoutAdmin(){
    const conf = confirm('Are you sure Logout..?')
    if(conf){
        location.href='admin/logout'
    }
}

