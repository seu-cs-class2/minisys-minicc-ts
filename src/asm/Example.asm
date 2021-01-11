.data	0x0
.text	0x0
fib:			# vars = 2, regs to save($s#) = 0, outgoing args = 4, need to save return address
	addiu	$sp, $sp, -32
	sw	$ra, 28($sp)
	sw	$a0, 32($sp)
	addiu	$t0, $zero, 1
	lw	$t1, 32($sp)
	sub	$t2, $t1, $t0
	nor	$t2, $t1, $t0
_label_2_true:
	beq	$t2, $zero, _label_3_false
	nop
	addiu	$t0, $zero, 1
	move	$v0, $t0
	lw	$ra, 28($sp)
	addiu	$sp, $sp, 32
	jr	$ra
_label_3_false:
	addiu	$t0, $zero, 2
	lw	$t1, 32($sp)
	sub	$t2, $t1, $t0
	nor	$t2, $t1, $t0
_label_4_true:
	beq	$t2, $zero, _label_5_false
	nop
	addiu	$t0, $zero, 0
	move	$v0, $t0
	lw	$ra, 28($sp)
	addiu	$sp, $sp, 32
	jr	$ra
_label_5_false:
	addiu	$t0, $zero, 1
	lw	$t1, 32($sp)
	sub	$t2, $t1, $t0
	move	$a0, $t2
	jal	fib
	move	$t0, $v0
	addiu	$t1, $zero, 2
	lw	$t2, 32($sp)
	sub	$t3, $t2, $t1
	sw	$t0, 20($sp)
	move	$a0, $t3
	jal	fib
	move	$t0, $v0
	lw	$t1, 20($sp)
	add	$t2, $t1, $t0
	move	$v0, $t2
	sw	$t0, 24($sp)
	lw	$ra, 28($sp)
	addiu	$sp, $sp, 32
	jr	$ra
main:			# vars = 1, regs to save($s#) = 0, outgoing args = 4, need to save return address
	addiu	$sp, $sp, -24
	sw	$ra, 20($sp)
	addiu	$t0, $zero, 5
	move	$a0, $t0
	jal	fib
	move	$t0, $v0
	addiu	$t1, $zero, 0
	move	$v0, $t1
	sw	$t0, 16($sp)
	lw	$ra, 20($sp)
	addiu	$sp, $sp, 24
	jr	$ra